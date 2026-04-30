// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ── iExec Nox ─────────────────────────────────────────────────────────────────
import {
    Nox,
    euint256,
    externalEuint256
} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

// ── OpenZeppelin ──────────────────────────────────────────────────────────────
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ICESTToken} from "../interfaces/ICESTToken.sol";
import {
    LockPeriodNotEnded,
    InsufficientStake,
    InvalidLockDays,
    InvalidAmount,
    ZeroAddress
} from "../libraries/ChainEstateLib.sol";

/// @title CESTToken
/// @author ChainEstate Team
/// @notice ChainEstate governance and utility token with tiered staking.
///         Staked CEST earns platform fee discounts and future governance rights.
/// @dev ERC20Votes enables on-chain governance via Compound-style voting delegation.
/// @custom:security-contact security@chainestate.io
contract CESTToken is ERC20, ERC20Votes, ERC20Permit, Ownable, ICESTToken {
    // ============ Supply Constants ============

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000e18;

    uint256 public constant ECOSYSTEM_SUPPLY  = 300_000_000e18;
    uint256 public constant AIRDROP_SUPPLY    = 250_000_000e18;
    uint256 public constant INVESTOR_SUPPLY   = 200_000_000e18;
    uint256 public constant TEAM_SUPPLY       = 150_000_000e18;
    uint256 public constant RESERVE_SUPPLY    = 100_000_000e18;

    // ============ Tier Thresholds ============

    uint256 public constant BRONZE_THRESHOLD   = 1_000e18;
    uint256 public constant SILVER_THRESHOLD   = 10_000e18;
    uint256 public constant GOLD_THRESHOLD     = 50_000e18;
    uint256 public constant PLATINUM_THRESHOLD = 200_000e18;

    // ============ Lock Bounds ============

    uint256 public constant MIN_LOCK_DAYS = 30;
    uint256 public constant MAX_LOCK_DAYS = 365;

    // ============ Storage ============

    mapping(address => StakeInfo) public stakes;

    /// @dev Encrypted stake amount per wallet (iExec Nox euint256).
    ///      Set by the staker via encryptMyStake() after calling stake().
    ///      Allows the privacy layer to verify stake amount without revealing it on-chain.
    mapping(address => euint256) private _encryptedStake;

    event StakeEncrypted(address indexed user);

    // ============ Constructor ============

    /// @param ecosystemWallet  Receives 30% ecosystem allocation
    /// @param airdropWallet    Receives 25% airdrop allocation
    /// @param investorWallet   Receives 20% investor allocation
    /// @param teamWallet       Receives 15% team allocation
    /// @param reserveWallet    Receives 10% reserve allocation
    constructor(
        address ecosystemWallet,
        address airdropWallet,
        address investorWallet,
        address teamWallet,
        address reserveWallet
    )
        ERC20("ChainEstate Token", "CEST")
        ERC20Permit("ChainEstate Token")
        Ownable(msg.sender)
    {
        if (ecosystemWallet == address(0)) revert ZeroAddress();
        if (airdropWallet == address(0)) revert ZeroAddress();
        if (investorWallet == address(0)) revert ZeroAddress();
        if (teamWallet == address(0)) revert ZeroAddress();
        if (reserveWallet == address(0)) revert ZeroAddress();

        _mint(ecosystemWallet, ECOSYSTEM_SUPPLY);
        _mint(airdropWallet,   AIRDROP_SUPPLY);
        _mint(investorWallet,  INVESTOR_SUPPLY);
        _mint(teamWallet,      TEAM_SUPPLY);
        _mint(reserveWallet,   RESERVE_SUPPLY);
    }

    // ============ Staking ============

    /// @notice Stake CEST tokens for a fixed lock period to earn tier benefits.
    ///         Each stake call adds to the existing staked amount and resets the tier.
    /// @param amount CEST amount to stake (18 decimals)
    /// @param lockDays Lock duration in days (30 – 365)
    function stake(uint256 amount, uint256 lockDays) external override {
        if (amount == 0) revert InvalidAmount();
        if (lockDays < MIN_LOCK_DAYS || lockDays > MAX_LOCK_DAYS)
            revert InvalidLockDays(MIN_LOCK_DAYS, MAX_LOCK_DAYS, lockDays);

        _transfer(msg.sender, address(this), amount);

        StakeInfo storage info = stakes[msg.sender];
        StakingTier oldTier = info.tier;

        info.amount += amount;
        info.stakedAt = block.timestamp;
        info.lockUntil = block.timestamp + (lockDays * 1 days);
        info.tier = _calculateTier(info.amount);

        if (info.tier != oldTier) {
            emit TierUpgraded(msg.sender, oldTier, info.tier);
        }

        emit Staked(msg.sender, amount, info.lockUntil, info.tier);
    }

    /// @notice Unstake CEST tokens after the lock period has expired.
    /// @param amount CEST amount to unstake
    function unstake(uint256 amount) external override {
        if (amount == 0) revert InvalidAmount();

        StakeInfo storage info = stakes[msg.sender];
        if (block.timestamp < info.lockUntil) revert LockPeriodNotEnded(info.lockUntil);
        if (info.amount < amount) revert InsufficientStake(amount, info.amount);

        info.amount -= amount;
        info.tier = _calculateTier(info.amount);

        _transfer(address(this), msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    // ============ Nox — Confidential Stake Record ============

    /**
     * @notice Store an encrypted record of your staked CEST amount using iExec Nox.
     *         Call this after stake() to add a confidential layer on top of your
     *         on-chain stake. The encrypted value is verified by the Intel TDX TEE
     *         and stored as euint256 — not readable by any on-chain observer.
     *
     *  Usage (same pattern as PropertyToken.purchaseTokens):
     *    const { handle, handleProof } = await encryptInput(stakedAmount, noxClient)
     *    await cestToken.encryptMyStake(handle, handleProof)
     *
     * @param handle      externalEuint256 produced by the iExec Nox iApp in TEE
     * @param handleProof Input proof from Handle Gateway validating the encrypted value
     */
    function encryptMyStake(
        externalEuint256 handle,
        bytes calldata handleProof
    ) external {
        require(stakes[msg.sender].amount > 0, "CESTToken: nothing staked");

        euint256 encAmount = Nox.fromExternal(handle, handleProof);
        Nox.allowThis(encAmount);
        Nox.allow(encAmount, msg.sender);

        _encryptedStake[msg.sender] = encAmount;

        emit StakeEncrypted(msg.sender);
    }

    /// @notice Returns the Nox encrypted stake handle for a wallet.
    ///         Only readable by the holder (via Nox.allow) or this contract.
    function encryptedStake(address holder) external view returns (euint256) {
        return _encryptedStake[holder];
    }

    // ============ View Functions ============

    /// @notice Returns the staking tier of a user based on their staked amount
    function getTier(address user) external view override returns (StakingTier) {
        return _calculateTier(stakes[user].amount);
    }

    /// @notice Returns fee discount in basis points (0 = no discount, 10000 = 100% free)
    function getFeeDiscount(address user) external view override returns (uint256 discountBps) {
        StakingTier tier = _calculateTier(stakes[user].amount);
        if (tier == StakingTier.PLATINUM) return 10000;
        if (tier == StakingTier.GOLD)     return 5000;
        if (tier == StakingTier.SILVER)   return 3000;
        if (tier == StakingTier.BRONZE)   return 1000;
        return 0;
    }

    // ============ Internal ============

    function _calculateTier(uint256 stakedAmount) internal pure returns (StakingTier) {
        if (stakedAmount >= PLATINUM_THRESHOLD) return StakingTier.PLATINUM;
        if (stakedAmount >= GOLD_THRESHOLD)     return StakingTier.GOLD;
        if (stakedAmount >= SILVER_THRESHOLD)   return StakingTier.SILVER;
        if (stakedAmount >= BRONZE_THRESHOLD)   return StakingTier.BRONZE;
        return StakingTier.NONE;
    }

    // ============ ERC20Votes Overrides ============

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
