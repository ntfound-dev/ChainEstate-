// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ChainEstateLib} from "../libraries/ChainEstateLib.sol";

/// @title IPropertyRegistry
/// @author ChainEstate Team
/// @notice Interface for the central property registry
interface IPropertyRegistry {
    event PropertyListed(uint256 indexed propertyId, address indexed tokenContract, string name);
    event PropertyStatusChanged(uint256 indexed propertyId, ChainEstateLib.PropertyStatus newStatus);
    event HolderRegistered(uint256 indexed propertyId, address indexed holder);

    /// @notice List a new property and deploy its PropertyToken via CREATE2
    function listProperty(
        string calldata name,
        string calldata location,
        string calldata ipfsDocHash,
        uint256 totalSupply,
        uint256 pricePerToken,
        uint256 monthlyRent
    ) external returns (uint256 propertyId, address tokenContract);

    /// @notice Set status for a property
    function setPropertyStatus(uint256 propertyId, ChainEstateLib.PropertyStatus status) external;

    /// @notice Set the RentDistributor contract address
    function setRentDistributor(address _rentDistributor) external;

    /// @notice Get all active properties
    function getActiveProperties() external view returns (ChainEstateLib.Property[] memory);

    /// @notice Get a single property by ID
    function getProperty(uint256 propertyId) external view returns (ChainEstateLib.Property memory);

    /// @notice Register a holder for a property (called by PropertyToken after purchase)
    function registerHolder(uint256 propertyId, address holder) external;

    /// @notice Get all holders of a property
    function getPropertyHolders(uint256 propertyId) external view returns (address[] memory);
}
