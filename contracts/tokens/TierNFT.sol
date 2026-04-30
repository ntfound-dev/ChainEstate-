// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ── iExec Nox ────────────────────────────────────────────────────────────────
import {
    Nox,
    euint256,
    externalEuint256
} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

// ── OpenZeppelin ──────────────────────────────────────────────────────────────
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// ── ChainEstate interfaces ────────────────────────────────────────────────────
import {ICESTToken} from "../interfaces/ICESTToken.sol";

/// @dev Minimal slice of IPropertyRegistry used only for the Gold/Platinum holder gate.
///      propertyCount() is the auto-generated getter for the public uint256 state variable.
interface IPropertyRegistryGate {
    function isHolder(uint256 propertyId, address account) external view returns (bool);
    function propertyCount() external view returns (uint256);
}

/**
 * @title TierNFT
 * @notice Soulbound investor tier badge for ChainEstate.
 *
 *  ── Tier eligibility (CESTToken staking tier) ────────────────────────────────
 *    Tier is read from CESTToken.getTier() — which is based on *staked* CEST,
 *    not raw balance. Users must call CESTToken.stake() first.
 *
 *    Bronze   (CEST staking tier 1)  —  5% fee discount · 1.10× airdrop · costs   500 CEST
 *    Silver   (CEST staking tier 2)  — 10% fee discount · 1.25× airdrop · costs 2,000 CEST
 *    Gold     (CEST staking tier 3)  — 15% fee discount · 1.50× airdrop · costs 8,000 CEST
 *    Platinum (CEST staking tier 4)  — 20% fee discount · 2.00× airdrop · costs 25,000 CEST
 *
 *  ── iExec Nox integration ────────────────────────────────────────────────────
 *    On-chain testnet interaction points are stored as encrypted euint256 values
 *    via Nox.fromExternal(handle, handleProof) — identical to the pattern used in
 *    PropertyToken.purchaseTokens(). No on-chain observer can read point balances.
 *
 *    Gold/Platinum are additionally gated by PropertyRegistry.isHolder() — proof
 *    that the wallet previously interacted with an ERC-7984 Nox PropertyToken.
 *
 *  ── Treasury (fee-discount reserve) ─────────────────────────────────────────
 *    Mint and upgrade costs in CEST are sent to the treasury address.
 *    Treasury funds the fee-discount subsidy pool for platform trading fees.
 */
contract TierNFT is ERC721, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── External contracts ───────────────────────────────────────────────────

    IERC20               public immutable cestToken;
    ICESTToken           public immutable cestStaking;    // reads staking tier
    IPropertyRegistryGate public immutable registry;     // Nox holder gate
    address              public treasury;

    // ── Mint costs (CEST sent to treasury) ───────────────────────────────────

    uint256 public constant BRONZE_COST   =    500 * 1e18;
    uint256 public constant SILVER_COST   =  2_000 * 1e18;
    uint256 public constant GOLD_COST     =  8_000 * 1e18;
    uint256 public constant PLATINUM_COST = 25_000 * 1e18;

    // ── Types ────────────────────────────────────────────────────────────────

    enum Tier { None, Bronze, Silver, Gold, Platinum }

    // ── State ────────────────────────────────────────────────────────────────

    uint256 private _nextId = 1;
    uint256 public  totalCestToTreasury;

    mapping(address => uint256) public holderToken;   // wallet → tokenId (0 = no badge)
    mapping(uint256 => Tier)    public tokenTier;     // tokenId → tier at last mint/upgrade

    /// @dev Encrypted interaction points per wallet.
    ///      Written via recordPoints() using Nox handle + proof (same as PropertyToken).
    ///      Only the holder + this contract can decrypt. Amounts are never visible on-chain.
    mapping(address => euint256) private _encryptedPoints;

    // ── Events ───────────────────────────────────────────────────────────────

    event TierMinted   (address indexed holder, uint256 tokenId, Tier tier, uint256 cestSpent);
    event TierUpgraded (address indexed holder, uint256 tokenId, Tier from, Tier to, uint256 cestSpent);
    event PointsRecorded (address indexed holder); // amount intentionally omitted — confidential
    event TreasurySet  (address indexed newTreasury);

    // ── Errors ───────────────────────────────────────────────────────────────

    error AlreadyMinted();
    error NoTierEligible();
    error NoUpgradeAvailable();
    error Soulbound();
    error PropertyHolderRequired();

    // ─────────────────────────────────────────────────────────────────────────

    constructor(
        address cestToken_,
        address registry_,
        address treasury_,
        address initialOwner
    )
        ERC721("ChainEstate Tier Badge", "CETIER")
        Ownable(initialOwner)
    {
        cestToken   = IERC20(cestToken_);
        cestStaking = ICESTToken(cestToken_);   // CESTToken implements both IERC20 + ICESTToken
        registry    = IPropertyRegistryGate(registry_);
        treasury    = treasury_;
    }

    // ── Views ────────────────────────────────────────────────────────────────

    /// @notice Tier this wallet qualifies for, based on CESTToken staking tier.
    ///         Reads ICESTToken.getTier() — requires the user to have staked CEST first.
    function getTier(address holder) public view returns (Tier) {
        ICESTToken.StakingTier st = cestStaking.getTier(holder);
        if (st == ICESTToken.StakingTier.PLATINUM) return Tier.Platinum;
        if (st == ICESTToken.StakingTier.GOLD)     return Tier.Gold;
        if (st == ICESTToken.StakingTier.SILVER)   return Tier.Silver;
        if (st == ICESTToken.StakingTier.BRONZE)   return Tier.Bronze;
        return Tier.None;
    }

    /// @notice True if wallet holds tokens in at least one registered Nox PropertyToken.
    function isPropertyHolder(address wallet) public view returns (bool) {
        uint256 count = registry.propertyCount();
        for (uint256 i = 1; i <= count; i++) {
            if (registry.isHolder(i, wallet)) return true;
        }
        return false;
    }

    /// @notice CEST cost to mint the given tier.
    function mintCostFor(Tier tier) public pure returns (uint256) {
        if (tier == Tier.Platinum) return PLATINUM_COST;
        if (tier == Tier.Gold)     return GOLD_COST;
        if (tier == Tier.Silver)   return SILVER_COST;
        if (tier == Tier.Bronze)   return BRONZE_COST;
        return 0;
    }

    /// @notice Airdrop multiplier in basis points (100 = 1×). Based on minted badge tier.
    function airdropMultiplierBps(address holder) public view returns (uint16) {
        uint256 tokenId = holderToken[holder];
        if (tokenId == 0) return 100;
        Tier t = tokenTier[tokenId];
        if (t == Tier.Platinum) return 200;
        if (t == Tier.Gold)     return 150;
        if (t == Tier.Silver)   return 125;
        if (t == Tier.Bronze)   return 110;
        return 100;
    }

    /// @notice Fee discount percentage (0–20). Based on minted badge tier.
    function feeDiscount(address holder) external view returns (uint8) {
        uint256 tokenId = holderToken[holder];
        if (tokenId == 0) return 0;
        Tier t = tokenTier[tokenId];
        if (t == Tier.Platinum) return 20;
        if (t == Tier.Gold)     return 15;
        if (t == Tier.Silver)   return 10;
        if (t == Tier.Bronze)   return 5;
        return 0;
    }

    function hasBadge(address holder) external view returns (bool) {
        return holderToken[holder] != 0;
    }

    function badgeTier(address holder) external view returns (Tier) {
        uint256 tokenId = holderToken[holder];
        if (tokenId == 0) return Tier.None;
        return tokenTier[tokenId];
    }

    /// @notice Returns the Nox encrypted points handle for the given holder.
    ///         Caller must have been granted access via Nox.allow() to decrypt.
    function encryptedPoints(address holder) external view returns (euint256) {
        return _encryptedPoints[holder];
    }

    // ── Mutations ────────────────────────────────────────────────────────────

    /**
     * @notice Mint your tier badge.
     *
     *  Flow:
     *    1. CESTToken.stake(amount, lockDays)  — lock CEST to earn a staking tier
     *    2. CEST.approve(address(this), mintCostFor(tier))
     *    3. TierNFT.mint()
     *
     *  Gold/Platinum: additionally requires holding a Nox ERC-7984 PropertyToken.
     *  Mint cost is transferred to treasury (fee-discount reserve).
     */
    function mint() external nonReentrant {
        if (holderToken[msg.sender] != 0) revert AlreadyMinted();

        Tier tier = getTier(msg.sender);
        if (tier == Tier.None) revert NoTierEligible();

        // Nox holder gate: Gold/Platinum require prior ERC-7984 PropertyToken interaction
        if (tier == Tier.Gold || tier == Tier.Platinum) {
            if (!isPropertyHolder(msg.sender)) revert PropertyHolderRequired();
        }

        uint256 cost = mintCostFor(tier);
        cestToken.safeTransferFrom(msg.sender, treasury, cost);
        totalCestToTreasury += cost;

        uint256 tokenId = _nextId++;
        holderToken[msg.sender] = tokenId;
        tokenTier[tokenId] = tier;
        _safeMint(msg.sender, tokenId);

        emit TierMinted(msg.sender, tokenId, tier, cost);
    }

    /**
     * @notice Upgrade badge to a higher tier by paying the CEST cost delta.
     *         Requires CESTToken.getTier() to have increased since last mint.
     *         Example: Bronze → Gold = GOLD_COST − BRONZE_COST = 7,500 CEST
     */
    function upgrade() external nonReentrant {
        uint256 tokenId = holderToken[msg.sender];
        require(tokenId != 0, "TierNFT: mint first");

        Tier current = tokenTier[tokenId];
        Tier next    = getTier(msg.sender);
        if (uint8(next) <= uint8(current)) revert NoUpgradeAvailable();

        if (next == Tier.Gold || next == Tier.Platinum) {
            if (!isPropertyHolder(msg.sender)) revert PropertyHolderRequired();
        }

        uint256 cost = mintCostFor(next) - mintCostFor(current);
        cestToken.safeTransferFrom(msg.sender, treasury, cost);
        totalCestToTreasury += cost;

        tokenTier[tokenId] = next;
        emit TierUpgraded(msg.sender, tokenId, current, next, cost);
    }

    /**
     * @notice Record encrypted on-chain testnet interaction points.
     *         Owner only. Uses iExec Nox SDK (same as PropertyToken.purchaseTokens):
     *           handle      — externalEuint256 from Nox iApp in Intel TDX TEE
     *           handleProof — Input proof from Handle Gateway
     *
     *  Point amounts are stored as euint256 — never readable on-chain.
     *  The holder decrypts their score off-chain via the Nox JS SDK.
     *
     *  Operator point values:
     *    purchaseTokens (primary buy)     → 2,000 pts
     *    executeBuy (secondary market)    → 1,500 pts
     *    castVote (governance)            →   800 pts
     *    createListing (secondary market) →   500 pts
     *    transfer (direct)                →   300 pts
     */
    function recordPoints(
        address holder,
        externalEuint256 handle,
        bytes calldata handleProof
    ) external onlyOwner {
        euint256 amount = Nox.fromExternal(handle, handleProof);
        Nox.allowThis(amount);
        Nox.allow(amount, holder);

        _encryptedPoints[holder] = Nox.isInitialized(_encryptedPoints[holder])
            ? Nox.add(_encryptedPoints[holder], amount)
            : amount;

        emit PointsRecorded(holder);
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    function setTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;
        emit TreasurySet(newTreasury);
    }

    // ── Soulbound ─────────────────────────────────────────────────────────────

    function _update(address to, uint256 tokenId, address auth)
        internal override returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }
}
