// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {externalEuint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

/// @title ISecondaryMarket
/// @author ChainEstate Team
/// @notice Interface for the property token secondary market DEX
interface ISecondaryMarket {
    struct Listing {
        uint256 listingId;
        address seller;
        address tokenContract;
        uint256 propertyId;
        uint256 tokenAmount;
        uint256 pricePerToken;
        uint256 listedAt;
        bool active;
    }

    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 propertyId,
        uint256 tokenAmount,
        uint256 pricePerToken
    );
    event ListingExecuted(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 totalPrice,
        uint256 fee
    );
    event ListingCancelled(uint256 indexed listingId, address indexed seller);

    /// @notice Seller lists tokens for sale
    function createListing(
        address tokenContract,
        uint256 propertyId,
        uint256 tokenAmount,
        uint256 pricePerToken
    ) external returns (uint256 listingId);

    /// @notice Buyer executes a purchase from a listing.
    ///         handle and handleProof must be produced by the iExec Nox iApp running in a TEE —
    ///         they encode the listing's tokenAmount as an encrypted euint256.
    function executeBuy(uint256 listingId, externalEuint256 handle, bytes calldata handleProof) external;

    /// @notice Seller cancels their listing
    function cancelListing(uint256 listingId) external;

    /// @notice Admin sets the trading fee in basis points
    function setTradingFee(uint256 _feeBps) external;

    /// @notice Get all active listings for a specific property
    function getListingsByProperty(uint256 propertyId) external view returns (Listing[] memory);

    /// @notice Get all active listings across all properties
    function getAllActiveListings() external view returns (Listing[] memory);
}
