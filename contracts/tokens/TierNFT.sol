// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @dev Nox layer gate — checks if a wallet has invested in any property via
///      PropertyRegistry (the same registry used by iExec Nox confidential tokens).
interface IPropertyRegistry {
    function isHolder(uint256 propertyId, address account) external view returns (bool);
    function propertyCount() external view returns (uint256);
}

/**
 * @title TierNFT
 * @notice Soulbound tier badge for ChainEstate investors.
 *
 *  Tiers (CEST balance thresholds):
 *    Bronze   ≥   1,000 CEST  —  5% fee discount · 1.10× airdrop · costs   500 CEST
 *    Silver   ≥  10,000 CEST  — 10% fee discount · 1.25× airdrop · costs 2,000 CEST
 *    Gold     ≥  50,000 CEST  — 15% fee discount · 1.50× airdrop · costs 8,000 CEST  (+ must hold a property)
 *    Platinum ≥ 200,000 CEST  — 20% fee discount · 2.00× airdrop · costs 25,000 CEST (+ must hold a property)
 *
 *  Mint cost is burned to treasury — the treasury funds the fee-discount subsidy pool.
 *  Points earned during the testnet period are stored on-chain and multiplied by the
 *  holder's tier before snapshot; effectivePoints(address) returns the final figure.
 */
contract TierNFT is ERC721, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20              public immutable cestToken;
    IPropertyRegistry   public immutable registry;
    address             public treasury;

    // ── Tier thresholds (18 dec) ─────────────────────────────────────────────
    uint256 public constant BRONZE_THRESHOLD   =   1_000 * 1e18;
    uint256 public constant SILVER_THRESHOLD   =  10_000 * 1e18;
    uint256 public constant GOLD_THRESHOLD     =  50_000 * 1e18;
    uint256 public constant PLATINUM_THRESHOLD = 200_000 * 1e18;

    // ── Mint costs (CEST burned → treasury) ──────────────────────────────────
    uint256 public constant BRONZE_COST   =    500 * 1e18;
    uint256 public constant SILVER_COST   =  2_000 * 1e18;
    uint256 public constant GOLD_COST     =  8_000 * 1e18;
    uint256 public constant PLATINUM_COST = 25_000 * 1e18;

    enum Tier { None, Bronze, Silver, Gold, Platinum }

    uint256 private _nextId = 1;
    uint256 public  totalCestToTreasury;

    mapping(address => uint256) public holderToken;    // wallet → tokenId (0 = no badge)
    mapping(uint256 => Tier)    public tokenTier;      // tokenId → tier at last mint/upgrade
    mapping(address => uint256) public testnetPoints;  // raw on-chain interaction points

    // ── Events ───────────────────────────────────────────────────────────────
    event TierMinted   (address indexed holder, uint256 tokenId, Tier tier, uint256 cestSpent);
    event TierUpgraded (address indexed holder, uint256 tokenId, Tier from, Tier to, uint256 cestSpent);
    event PointsAdded  (address indexed holder, uint256 added, uint256 totalRaw, uint256 effective);
    event TreasurySet  (address indexed newTreasury);

    // ── Errors ───────────────────────────────────────────────────────────────
    error AlreadyMinted();
    error NoTierEligible();
    error NoUpgradeAvailable();
    error Soulbound();
    error PropertyHolderRequired(); // Gold/Platinum: must hold ≥1 property via Nox registry

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
        cestToken = IERC20(cestToken_);
        registry  = IPropertyRegistry(registry_);
        treasury  = treasury_;
    }

    // ── Views ────────────────────────────────────────────────────────────────

    /// @notice Tier that this wallet qualifies for based on live CEST balance.
    function getTier(address holder) public view returns (Tier) {
        uint256 bal = cestToken.balanceOf(holder);
        if (bal >= PLATINUM_THRESHOLD) return Tier.Platinum;
        if (bal >= GOLD_THRESHOLD)     return Tier.Gold;
        if (bal >= SILVER_THRESHOLD)   return Tier.Silver;
        if (bal >= BRONZE_THRESHOLD)   return Tier.Bronze;
        return Tier.None;
    }

    /// @notice Returns true if wallet holds tokens in at least one registered property.
    ///         Used as the Nox-layer gate for Gold/Platinum minting.
    function isPropertyHolder(address wallet) public view returns (bool) {
        uint256 count = registry.propertyCount();
        for (uint256 i = 1; i <= count; i++) {
            if (registry.isHolder(i, wallet)) return true;
        }
        return false;
    }

    /// @notice CEST cost to mint the given tier badge.
    function mintCostFor(Tier tier) public pure returns (uint256) {
        if (tier == Tier.Platinum) return PLATINUM_COST;
        if (tier == Tier.Gold)     return GOLD_COST;
        if (tier == Tier.Silver)   return SILVER_COST;
        if (tier == Tier.Bronze)   return BRONZE_COST;
        return 0;
    }

    /// @notice Airdrop multiplier in basis points (100 = 1×). Based on minted tier.
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

    /// @notice Fee discount percentage (0–20). Based on minted tier.
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

    /// @notice Raw testnet points × tier multiplier = snapshot-ready allocation score.
    function effectivePoints(address holder) external view returns (uint256) {
        return (testnetPoints[holder] * airdropMultiplierBps(holder)) / 100;
    }

    // ── Mutations ────────────────────────────────────────────────────────────

    /**
     * @notice Mint your tier badge.
     *         Approvals required: CEST.approve(TierNFT, mintCostFor(tier))
     *         Gold/Platinum additionally require holding a property token (Nox registry gate).
     *         The CEST cost is transferred to the treasury (fee-discount reserve pool).
     */
    function mint() external nonReentrant {
        if (holderToken[msg.sender] != 0) revert AlreadyMinted();

        Tier tier = getTier(msg.sender);
        if (tier == Tier.None) revert NoTierEligible();

        // Nox property-holder gate for premium tiers
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
     * @notice Upgrade badge to a higher tier by paying the cost delta in CEST.
     *         Example: Bronze → Gold costs (GOLD_COST − BRONZE_COST) = 7,500 CEST.
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
     * @notice Record on-chain testnet interaction points for a wallet.
     *         Only the contract owner (platform operator) can call this.
     *         Points are stored raw; effectivePoints() applies the tier multiplier.
     *
     *  Standard point values (off-chain convention):
     *    Purchase property tokens   → 2,000 pts
     *    Execute secondary buy      → 1,500 pts
     *    Cast governance vote       → 800 pts
     *    List on secondary market   → 500 pts
     *    Direct token transfer      → 300 pts
     */
    function recordPoints(address holder, uint256 points) external onlyOwner {
        testnetPoints[holder] += points;
        uint256 effective = (testnetPoints[holder] * airdropMultiplierBps(holder)) / 100;
        emit PointsAdded(holder, points, testnetPoints[holder], effective);
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    function setTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;
        emit TreasurySet(newTreasury);
    }

    // ── Soulbound enforcement ─────────────────────────────────────────────────

    function _update(address to, uint256 tokenId, address auth)
        internal override returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }
}
