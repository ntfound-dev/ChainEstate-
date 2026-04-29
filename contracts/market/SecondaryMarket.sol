// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    Nox,
    euint256,
    externalEuint256
} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";
import {ISecondaryMarket} from "../interfaces/ISecondaryMarket.sol";
import {ICESTToken} from "../interfaces/ICESTToken.sol";
import {IPropertyRegistry} from "../interfaces/IPropertyRegistry.sol";
import {PropertyToken} from "../core/PropertyToken.sol";
import {
    ZeroAddress,
    InvalidAmount,
    TransferFailed,
    ListingNotActive,
    NotSeller
} from "../libraries/ChainEstateLib.sol";

/// @title SecondaryMarket
/// @author ChainEstate Team
/// @notice Simple order-book DEX for trading ChainEstate property tokens.
///         Sellers list tokens at a fixed price; buyers execute against listed offers.
///         Token amounts in listings are public (cleartext), but balances on PropertyToken
///         remain encrypted via ERC-7984.
/// @dev Trading fee is reduced for CEST stakers (via ICESTToken.getFeeDiscount).
///      SecondaryMarket must be granted operator rights by the seller on PropertyToken
///      before a listing can be executed.
/// @custom:security-contact security@chainestate.io
contract SecondaryMarket is ISecondaryMarket, Ownable, ReentrancyGuard, Pausable {
    // ============ Storage ============

    address public cestToken;
    address public usdtToken;
    address public treasury;
    address public registry;

    mapping(uint256 => Listing) public listings;
    uint256 public listingCount;

    uint256 public tradingFeeBps;

    uint256 public constant MAX_FEE_BPS = 1000; // 10% cap

    // ============ Constructor ============

    constructor(
        address _cestToken,
        address _usdtToken,
        address _treasury,
        address _registry
    ) Ownable(msg.sender) {
        if (_usdtToken == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();
        if (_registry == address(0)) revert ZeroAddress();
        cestToken = _cestToken;
        usdtToken = _usdtToken;
        treasury = _treasury;
        registry = _registry;
        tradingFeeBps = 50; // 0.5% default
    }

    // ============ Listing Functions ============

    /// @notice Seller creates a listing for their property tokens.
    ///         Tokens remain in seller's wallet until executeBuy is called.
    ///         Seller must have granted SecondaryMarket as an operator on PropertyToken
    ///         (via PropertyToken.grantOperator) before calling this function.
    /// @param tokenContract Address of the property's PropertyToken contract
    /// @param propertyId ID of the property in PropertyRegistry
    /// @param tokenAmount Number of tokens to sell (public, cleartext)
    /// @param pricePerToken USDT price per token (6 decimals)
    /// @return listingId Assigned listing ID
    function createListing(
        address tokenContract,
        uint256 propertyId,
        uint256 tokenAmount,
        uint256 pricePerToken
    ) external override nonReentrant whenNotPaused returns (uint256 listingId) {
        if (tokenContract == address(0)) revert ZeroAddress();
        if (tokenAmount == 0) revert InvalidAmount();
        if (pricePerToken == 0) revert InvalidAmount();

        // Verify token contract matches registry record
        require(
            IPropertyRegistry(registry).getProperty(propertyId).tokenContract == tokenContract,
            "Token/property mismatch"
        );

        // Verify seller has granted this contract as operator on their tokens
        require(
            PropertyToken(tokenContract).isOperatorActive(msg.sender, address(this)),
            "Market not approved as operator"
        );

        listingId = ++listingCount;
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            tokenContract: tokenContract,
            propertyId: propertyId,
            tokenAmount: tokenAmount,
            pricePerToken: pricePerToken,
            listedAt: block.timestamp,
            active: true
        });

        emit ListingCreated(listingId, msg.sender, propertyId, tokenAmount, pricePerToken);
    }

    /// @notice Buyer executes a purchase against an active listing.
    ///         Flow:
    ///           1. Frontend submits iExec task → iApp runs inside Intel TDX TEE
    ///           2. iApp calls Nox gateway, receives encrypted handle + proof for listing.tokenAmount
    ///           3. Frontend calls this function with handle + proof from iApp output
    ///           4. Buyer pays totalCost USDT; platform takes fee; seller receives net USDT
    ///           5. Nox.fromExternal verifies handle authenticity and imports the euint256
    ///           6. ERC-7984 confidentialTransferFrom moves tokens seller → buyer
    ///           7. Buyer registered as holder in PropertyRegistry
    /// @param listingId    ID of the listing to purchase
    /// @param handle       Encrypted token amount handle produced by the iExec Nox iApp in TEE
    /// @param handleProof  Input proof from Nox gateway validating the handle
    function executeBuy(
        uint256 listingId,
        externalEuint256 handle,
        bytes calldata handleProof
    ) external override nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        if (!listing.active) revert ListingNotActive(listingId);

        uint256 totalCost = listing.tokenAmount * listing.pricePerToken;

        // Calculate effective fee after CEST discount
        uint256 effectiveFeeBps = _effectiveFee(msg.sender);
        uint256 fee = (totalCost * effectiveFeeBps) / 10000;
        uint256 sellerReceives = totalCost - fee;

        // Mark inactive first (CEI: checks-effects-interactions)
        listing.active = false;

        // Collect payment from buyer
        bool ok = IERC20(usdtToken).transferFrom(msg.sender, address(this), totalCost);
        if (!ok) revert TransferFailed();

        // Send fee to treasury
        if (fee > 0) {
            bool feeOk = IERC20(usdtToken).transfer(treasury, fee);
            if (!feeOk) revert TransferFailed();
        }

        // Send proceeds to seller
        bool sellerOk = IERC20(usdtToken).transfer(listing.seller, sellerReceives);
        if (!sellerOk) revert TransferFailed();

        // Import the encrypted amount produced by the iExec Nox iApp running inside TEE.
        // Nox.fromExternal verifies the handle proof, ensuring the value was sealed
        // inside an Intel TDX enclave and was never exposed in plaintext on-chain.
        euint256 encryptedAmount = Nox.fromExternal(handle, handleProof);
        Nox.allowThis(encryptedAmount);
        Nox.allow(encryptedAmount, address(this));
        Nox.allow(encryptedAmount, listing.seller);
        Nox.allow(encryptedAmount, msg.sender);

        // Transfer property tokens from seller to buyer.
        // SecondaryMarket must already be an approved operator on the seller's PropertyToken.
        PropertyToken(listing.tokenContract).confidentialTransferFrom(
            listing.seller,
            msg.sender,
            encryptedAmount
        );

        // Register buyer as holder for future rent distributions.
        // SecondaryMarket must be approved via registry.setApprovedMarket before deploying.
        IPropertyRegistry(registry).registerHolder(listing.propertyId, msg.sender);

        emit ListingExecuted(listingId, msg.sender, listing.seller, totalCost, fee);
    }

    /// @notice Seller cancels their active listing
    /// @param listingId ID of the listing to cancel
    function cancelListing(uint256 listingId) external override nonReentrant {
        Listing storage listing = listings[listingId];
        if (!listing.active) revert ListingNotActive(listingId);
        if (listing.seller != msg.sender) revert NotSeller(listingId, msg.sender);

        listing.active = false;
        emit ListingCancelled(listingId, msg.sender);
    }

    // ============ Admin ============

    /// @notice Set trading fee in basis points (0.01% precision, max 10%)
    function setTradingFee(uint256 _feeBps) external override onlyOwner {
        require(_feeBps <= MAX_FEE_BPS, "Fee exceeds cap");
        tradingFeeBps = _feeBps;
    }

    // ============ View Functions ============

    /// @notice Get all active listings for a specific property
    function getListingsByProperty(uint256 propertyId) external view override returns (Listing[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].active && listings[i].propertyId == propertyId) count++;
        }
        Listing[] memory result = new Listing[](count);
        uint256 idx;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].active && listings[i].propertyId == propertyId) {
                result[idx++] = listings[i];
            }
        }
        return result;
    }

    /// @notice Get all active listings across all properties
    function getAllActiveListings() external view override returns (Listing[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].active) count++;
        }
        Listing[] memory result = new Listing[](count);
        uint256 idx;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].active) {
                result[idx++] = listings[i];
            }
        }
        return result;
    }

    // ============ Internal ============

    /// @dev Apply CEST tier discount to the base trading fee
    function _effectiveFee(address buyer) internal view returns (uint256) {
        if (cestToken == address(0)) return tradingFeeBps;
        try ICESTToken(cestToken).getFeeDiscount(buyer) returns (uint256 discountBps) {
            if (discountBps >= 10000) return 0;
            return (tradingFeeBps * (10000 - discountBps)) / 10000;
        } catch {
            return tradingFeeBps;
        }
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
