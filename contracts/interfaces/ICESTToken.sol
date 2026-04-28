// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ICESTToken
/// @author ChainEstate Team
/// @notice Interface for the ChainEstate governance and utility token
interface ICESTToken {
    enum StakingTier { NONE, BRONZE, SILVER, GOLD, PLATINUM }

    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 lockUntil;
        StakingTier tier;
    }

    event Staked(address indexed user, uint256 amount, uint256 lockUntil, StakingTier tier);
    event Unstaked(address indexed user, uint256 amount);
    event TierUpgraded(address indexed user, StakingTier oldTier, StakingTier newTier);

    /// @notice Stake CEST tokens to earn tier benefits
    function stake(uint256 amount, uint256 lockDays) external;

    /// @notice Unstake CEST after lock period has ended
    function unstake(uint256 amount) external;

    /// @notice Get user's current staking tier
    function getTier(address user) external view returns (StakingTier);

    /// @notice Get fee discount in basis points for a user
    function getFeeDiscount(address user) external view returns (uint256 discountBps);
}
