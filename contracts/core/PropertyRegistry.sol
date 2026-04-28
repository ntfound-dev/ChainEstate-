// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ChainEstateLib} from "../libraries/ChainEstateLib.sol";
import {PropertyToken} from "./PropertyToken.sol";
import {
    PropertyNotFound,
    PropertyNotActive,
    ZeroAddress,
    InvalidAmount,
    Unauthorized
} from "../libraries/ChainEstateLib.sol";

/// @title PropertyRegistry
/// @author ChainEstate Team
/// @notice Central registry for all ChainEstate properties. Deploys a new PropertyToken
///         via CREATE2 for each listed property, enabling deterministic addresses.
/// @dev Only owner (platform admin) can list properties. PropertyToken contracts call back
///      into this registry to register holders for rent distribution.
/// @custom:security-contact security@chainestate.io
contract PropertyRegistry is Ownable, Pausable, ReentrancyGuard {
    using ChainEstateLib for ChainEstateLib.Property;

    // ============ Storage ============

    mapping(uint256 => ChainEstateLib.Property) public properties;
    uint256 public propertyCount;

    /// @dev List of all holder addresses per property (used by RentDistributor)
    mapping(uint256 => address[]) private propertyHolders;

    /// @dev Track whether an address is already registered as holder to avoid duplicates
    mapping(uint256 => mapping(address => bool)) private _isHolder;

    address public rentDistributor;
    address public usdtToken;

    /// @dev Approved market contracts (e.g., SecondaryMarket) that can also register holders
    mapping(address => bool) public approvedMarkets;

    // ============ Events ============

    event PropertyListed(uint256 indexed propertyId, address indexed tokenContract, string name);
    event PropertyStatusChanged(uint256 indexed propertyId, ChainEstateLib.PropertyStatus newStatus);
    event HolderRegistered(uint256 indexed propertyId, address indexed holder);
    event RentDistributorSet(address indexed rentDistributor);
    event MarketApproved(address indexed market, bool approved);

    // ============ Constructor ============

    constructor(address _usdtToken) Ownable(msg.sender) {
        if (_usdtToken == address(0)) revert ZeroAddress();
        usdtToken = _usdtToken;
    }

    // ============ Admin Functions ============

    /// @notice List a new property on the platform.
    ///         Deploys a fresh PropertyToken contract deterministically via CREATE2.
    /// @param name Property name (e.g., "The Pearl Residences")
    /// @param location Property location (e.g., "Dubai, UAE")
    /// @param ipfsDocHash IPFS hash of SPV docs and property photos
    /// @param totalSupply Number of fractional tokens to mint
    /// @param pricePerToken Price per token in USDT (6 decimals)
    /// @param monthlyRent Estimated monthly rental income in USDT
    /// @return propertyId Assigned property ID
    /// @return tokenContract Deployed PropertyToken address
    function listProperty(
        string calldata name,
        string calldata location,
        string calldata ipfsDocHash,
        uint256 totalSupply,
        uint256 pricePerToken,
        uint256 monthlyRent
    ) external onlyOwner whenNotPaused nonReentrant returns (uint256 propertyId, address tokenContract) {
        if (totalSupply == 0) revert InvalidAmount();
        if (pricePerToken == 0) revert InvalidAmount();

        propertyId = ++propertyCount;

        // Deploy PropertyToken with CREATE2 using propertyId as salt for deterministic address
        bytes32 salt = bytes32(propertyId);
        PropertyToken token = new PropertyToken{salt: salt}();

        tokenContract = address(token);

        token.initialize(
            propertyId,
            address(this),
            rentDistributor,
            totalSupply,
            pricePerToken,
            usdtToken
        );

        // Transfer ownership of the token contract to the registry owner (admin)
        token.transferOwnership(owner());

        properties[propertyId] = ChainEstateLib.Property({
            id: propertyId,
            name: name,
            location: location,
            ipfsDocHash: ipfsDocHash,
            totalSupply: totalSupply,
            pricePerToken: pricePerToken,
            monthlyRent: monthlyRent,
            listedAt: block.timestamp,
            tokenContract: tokenContract,
            status: ChainEstateLib.PropertyStatus.ACTIVE
        });

        emit PropertyListed(propertyId, tokenContract, name);
    }

    /// @notice Update the status of a listed property
    /// @param propertyId Property to update
    /// @param status New status
    function setPropertyStatus(
        uint256 propertyId,
        ChainEstateLib.PropertyStatus status
    ) external onlyOwner {
        if (properties[propertyId].id == 0) revert PropertyNotFound(propertyId);
        properties[propertyId].status = status;
        emit PropertyStatusChanged(propertyId, status);
    }

    /// @notice Set the RentDistributor contract address
    /// @param _rentDistributor Address of the deployed RentDistributor
    function setRentDistributor(address _rentDistributor) external onlyOwner {
        if (_rentDistributor == address(0)) revert ZeroAddress();
        rentDistributor = _rentDistributor;
        emit RentDistributorSet(_rentDistributor);
    }

    /// @notice Approve or revoke a market contract to register holders
    /// @param market Address of the market contract (e.g., SecondaryMarket)
    /// @param approved Whether to approve or revoke
    function setApprovedMarket(address market, bool approved) external onlyOwner {
        if (market == address(0)) revert ZeroAddress();
        approvedMarkets[market] = approved;
        emit MarketApproved(market, approved);
    }

    // ============ Holder Registration ============

    /// @notice Register an investor as a holder of a property.
    ///         Called automatically by PropertyToken.purchaseTokens() and by approved markets.
    /// @param propertyId Property the investor holds tokens for
    /// @param holder Investor address
    function registerHolder(uint256 propertyId, address holder) external {
        // Allow calls from the property's token contract OR approved market contracts
        if (
            msg.sender != properties[propertyId].tokenContract &&
            !approvedMarkets[msg.sender]
        ) revert Unauthorized();
        if (holder == address(0)) revert ZeroAddress();

        if (!_isHolder[propertyId][holder]) {
            _isHolder[propertyId][holder] = true;
            propertyHolders[propertyId].push(holder);
            emit HolderRegistered(propertyId, holder);
        }
    }

    // ============ View Functions ============

    /// @notice Returns all properties with ACTIVE status
    function getActiveProperties() external view returns (ChainEstateLib.Property[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= propertyCount; i++) {
            if (properties[i].status == ChainEstateLib.PropertyStatus.ACTIVE) count++;
        }

        ChainEstateLib.Property[] memory active = new ChainEstateLib.Property[](count);
        uint256 idx;
        for (uint256 i = 1; i <= propertyCount; i++) {
            if (properties[i].status == ChainEstateLib.PropertyStatus.ACTIVE) {
                active[idx++] = properties[i];
            }
        }
        return active;
    }

    /// @notice Returns details for a single property
    /// @param propertyId ID of the property
    function getProperty(uint256 propertyId) external view returns (ChainEstateLib.Property memory) {
        if (properties[propertyId].id == 0) revert PropertyNotFound(propertyId);
        return properties[propertyId];
    }

    /// @notice Returns the list of all holders for a property (used by RentDistributor)
    /// @param propertyId ID of the property
    function getPropertyHolders(uint256 propertyId) external view returns (address[] memory) {
        if (properties[propertyId].id == 0) revert PropertyNotFound(propertyId);
        return propertyHolders[propertyId];
    }

    /// @notice Returns whether an address is a registered holder of a property.
    ///         Used by ConfidentialGovernance for access control gating.
    function isHolder(uint256 propertyId, address account) external view returns (bool) {
        return _isHolder[propertyId][account];
    }

    /// @notice Returns the number of registered holders for a property.
    ///         Used by ConfidentialGovernance for quorum calculation.
    function getHolderCount(uint256 propertyId) external view returns (uint256) {
        return propertyHolders[propertyId].length;
    }

    // ============ Emergency ============

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
