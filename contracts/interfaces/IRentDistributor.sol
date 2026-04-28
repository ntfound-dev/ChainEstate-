// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ChainEstateLib} from "../libraries/ChainEstateLib.sol";

/// @title IRentDistributor
/// @author ChainEstate Team
/// @notice Interface for the private rent distribution contract
interface IRentDistributor {
    event RentDeposited(uint256 indexed propertyId, uint256 amount, uint256 timestamp);
    event RentDistributed(
        uint256 indexed propertyId,
        uint256 totalAmount,
        uint256 recipientCount,
        uint256 platformFee,
        uint256 maintenanceFee,
        uint256 timestamp
    );
    event MaintenanceWithdrawn(uint256 indexed propertyId, uint256 amount, address to);

    /// @notice Admin deposits monthly rent for a property
    function depositRent(uint256 propertyId, uint256 amount) external;

    /// @notice Trigger rent distribution to all property holders
    function distributeRent(uint256 propertyId) external;

    /// @notice Admin withdraws maintenance reserve
    function withdrawMaintenance(uint256 propertyId, uint256 amount, address to) external;

    /// @notice Get distribution history for a property
    function getDistributionHistory(uint256 propertyId) external view returns (ChainEstateLib.RentDistribution[] memory);

    /// @notice Get pending (undistributed) rent for a property
    function getPendingRent(uint256 propertyId) external view returns (uint256);
}
