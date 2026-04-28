// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ChainEstateLib
/// @author ChainEstate Team
/// @notice Shared structs, enums, errors, and constants for all ChainEstate contracts.
library ChainEstateLib {
    // ============ Structs ============

    struct Property {
        uint256 id;
        string name;
        string location;
        string ipfsDocHash;
        uint256 totalSupply;
        uint256 pricePerToken;
        uint256 monthlyRent;
        uint256 listedAt;
        address tokenContract;
        PropertyStatus status;
    }

    struct RentDistribution {
        uint256 propertyId;
        uint256 amount;
        uint256 platformFee;
        uint256 maintenanceFee;
        uint256 netAmount;
        uint256 distributedAt;
        uint256 recipientCount;
    }

    struct OperatorPermission {
        address operator;
        uint256 expiresAt;
        bool active;
    }

    // ============ Enums ============

    enum PropertyStatus {
        PENDING,
        ACTIVE,
        SOLD_OUT,
        DISTRIBUTING,
        INACTIVE
    }

    // ============ Constants ============

    uint256 constant PLATFORM_FEE_BPS = 500;
    uint256 constant MAINTENANCE_FEE_BPS = 500;
    uint256 constant INVESTOR_SHARE_BPS = 9000;
    uint256 constant BPS_DENOMINATOR = 10000;
    uint256 constant OPERATOR_DEFAULT_EXPIRY = 30 days;
}

// ============ Custom Errors ============

error Unauthorized();
error PropertyNotFound(uint256 propertyId);
error PropertyNotActive(uint256 propertyId);
error InsufficientPayment(uint256 required, uint256 sent);
error InvalidAmount();
error OperatorExpired(address operator);
error AlreadyInitialized();
error ZeroAddress();
error TransferFailed();
error LockPeriodNotEnded(uint256 lockUntil);
error InsufficientStake(uint256 required, uint256 current);
error InvalidLockDays(uint256 min, uint256 max, uint256 given);
error ListingNotActive(uint256 listingId);
error NotSeller(uint256 listingId, address caller);
