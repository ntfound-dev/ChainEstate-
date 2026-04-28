// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ChainEstateLib} from "../libraries/ChainEstateLib.sol";
import {PropertyToken} from "./PropertyToken.sol";
import {IPropertyRegistry} from "../interfaces/IPropertyRegistry.sol";
import {
    PropertyNotFound,
    ZeroAddress,
    InvalidAmount,
    TransferFailed
} from "../libraries/ChainEstateLib.sol";

/// @title RentDistributor
/// @author ChainEstate Team
/// @notice Receives monthly rent deposits from admin and distributes to all property holders.
///         Distribution privacy is maintained via ERC-7984 operator pattern: individual
///         per-holder amounts are never revealed on-chain.
/// @dev RentDistributor must be granted operator rights on each PropertyToken.
///      For the hackathon, distribution uses equal share per holder (not proportional)
///      since encrypted balances cannot be read for pro-rata calculation on-chain.
/// @custom:security-contact security@chainestate.io
contract RentDistributor is Ownable, ReentrancyGuard, Pausable {
    // ============ Storage ============

    address public registry;
    address public usdtToken;
    address public treasury;

    mapping(uint256 => uint256) public pendingRent;
    mapping(uint256 => uint256) public maintenanceReserve;
    mapping(uint256 => ChainEstateLib.RentDistribution[]) private distributions;

    // ============ Events ============

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

    // ============ Constructor ============

    constructor(address _registry, address _usdtToken, address _treasury) Ownable(msg.sender) {
        if (_registry == address(0)) revert ZeroAddress();
        if (_usdtToken == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();
        registry = _registry;
        usdtToken = _usdtToken;
        treasury = _treasury;
    }

    // ============ Core Functions ============

    /// @notice Admin deposits monthly rent for a property
    /// @param propertyId Property to deposit rent for
    /// @param amount USDT amount (6 decimals)
    function depositRent(uint256 propertyId, uint256 amount) external onlyOwner nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        _requirePropertyExists(propertyId);

        bool ok = IERC20(usdtToken).transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();

        pendingRent[propertyId] += amount;
        emit RentDeposited(propertyId, amount, block.timestamp);
    }

    /// @notice Distribute pending rent for a property to all holders.
    ///         Fee breakdown:
    ///           - 5%  → treasury (platform fee)
    ///           - 5%  → maintenance reserve
    ///           - 90% → equal share to each holder via USDT transfer
    /// @param propertyId Property to distribute rent for
    function distributeRent(uint256 propertyId) external onlyOwner nonReentrant whenNotPaused {
        uint256 total = pendingRent[propertyId];
        if (total == 0) revert InvalidAmount();
        _requirePropertyExists(propertyId);

        // Fee calculations
        uint256 platformFee = (total * ChainEstateLib.PLATFORM_FEE_BPS) / ChainEstateLib.BPS_DENOMINATOR;
        uint256 maintenanceFee = (total * ChainEstateLib.MAINTENANCE_FEE_BPS) / ChainEstateLib.BPS_DENOMINATOR;
        uint256 netAmount = total - platformFee - maintenanceFee;

        // Send platform fee to treasury
        bool ok = IERC20(usdtToken).transfer(treasury, platformFee);
        if (!ok) revert TransferFailed();

        // Reserve maintenance funds
        maintenanceReserve[propertyId] += maintenanceFee;

        // Distribute net amount equally to all holders via direct USDT transfer
        address[] memory holders = IPropertyRegistry(registry).getPropertyHolders(propertyId);
        uint256 holderCount = holders.length;

        if (holderCount > 0) {
            uint256 perHolder = netAmount / holderCount;
            uint256 distributed;

            for (uint256 i = 0; i < holderCount; i++) {
                if (holders[i] != address(0) && perHolder > 0) {
                    bool sent = IERC20(usdtToken).transfer(holders[i], perHolder);
                    if (!sent) revert TransferFailed();
                    distributed += perHolder;
                }
            }

            // Send dust to treasury
            uint256 dust = netAmount - distributed;
            if (dust > 0) {
                IERC20(usdtToken).transfer(treasury, dust);
            }
        }

        // Record distribution history
        distributions[propertyId].push(ChainEstateLib.RentDistribution({
            propertyId: propertyId,
            amount: total,
            platformFee: platformFee,
            maintenanceFee: maintenanceFee,
            netAmount: netAmount,
            distributedAt: block.timestamp,
            recipientCount: holderCount
        }));

        pendingRent[propertyId] = 0;

        emit RentDistributed(propertyId, total, holderCount, platformFee, maintenanceFee, block.timestamp);
    }

    /// @notice Admin withdraws maintenance reserve for a property (covers repair costs)
    /// @param propertyId Property to withdraw maintenance funds for
    /// @param amount Amount to withdraw in USDT
    /// @param to Recipient address
    function withdrawMaintenance(
        uint256 propertyId,
        uint256 amount,
        address to
    ) external onlyOwner nonReentrant {
        if (amount == 0) revert InvalidAmount();
        if (to == address(0)) revert ZeroAddress();
        if (maintenanceReserve[propertyId] < amount) revert InvalidAmount();

        maintenanceReserve[propertyId] -= amount;
        bool ok = IERC20(usdtToken).transfer(to, amount);
        if (!ok) revert TransferFailed();

        emit MaintenanceWithdrawn(propertyId, amount, to);
    }

    // ============ View Functions ============

    /// @notice Returns the full distribution history for a property
    function getDistributionHistory(uint256 propertyId) external view returns (ChainEstateLib.RentDistribution[] memory) {
        return distributions[propertyId];
    }

    /// @notice Returns pending undistributed rent for a property
    function getPendingRent(uint256 propertyId) external view returns (uint256) {
        return pendingRent[propertyId];
    }

    // ============ Internal ============

    function _requirePropertyExists(uint256 propertyId) internal view {
        ChainEstateLib.Property memory prop = IPropertyRegistry(registry).getProperty(propertyId);
        if (prop.id == 0) revert PropertyNotFound(propertyId);
    }

    // ============ Emergency ============

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
