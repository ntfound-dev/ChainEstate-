// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IPropertyRegistry} from "../interfaces/IPropertyRegistry.sol";

/// @title ConfidentialGovernance
/// @notice Property-level governance gated by ERC-7984 confidential token holding.
///
/// Utility of confidential tokens here:
///   - ACCESS CONTROL  : only registered holders of a PropertyToken may vote
///   - GOVERNANCE      : holders propose and vote on property decisions
///   - PRIVACY         : voting weight is equal-per-holder (no one can infer
///                       your balance from your voting power); the *fact* that
///                       balances are encrypted is what guarantees this fairness
///
/// Since ERC-7984 balances are encrypted and cannot be read on-chain, each
/// verified holder receives exactly 1 vote — making governance sybil-resistant
/// at the holder level while preserving full balance privacy.
contract ConfidentialGovernance is Ownable {

    // ─── Types ───────────────────────────────────────────────────────────────

    enum ProposalType {
        RentAdjustment,    // propose new monthly rent amount
        MaintenanceAction, // approve a maintenance spend
        StatusChange,      // change property status (active/paused/sold)
        General            // free-form community proposal
    }

    enum VoteOption { Against, For, Abstain }

    struct Proposal {
        uint256 proposalId;
        uint256 propertyId;
        ProposalType proposalType;
        address proposer;
        string description;
        uint256 votingDeadline;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool passed;
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    IPropertyRegistry public immutable registry;

    uint256 public proposalCount;
    uint256 public votingPeriod = 3 days;
    uint256 public quorumNumerator = 20; // 20% of holders must vote

    mapping(uint256 => Proposal) public proposals;
    /// proposalId => voter => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    /// proposalId => voter => choice
    mapping(uint256 => mapping(address => VoteOption)) public voteRecord;

    // ─── Events ──────────────────────────────────────────────────────────────

    event ProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed propertyId,
        ProposalType proposalType,
        address proposer,
        string description,
        uint256 deadline
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteOption option
    );

    event ProposalFinalized(
        uint256 indexed proposalId,
        bool passed,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes
    );

    // ─── Errors ──────────────────────────────────────────────────────────────

    error NotAHolder();
    error VotingClosed();
    error VotingStillOpen();
    error AlreadyVoted();
    error AlreadyExecuted();
    error ProposalNotFound();
    error QuorumNotReached();

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _registry) Ownable(msg.sender) {
        registry = IPropertyRegistry(_registry);
    }

    // ─── Modifiers ───────────────────────────────────────────────────────────

    /// @dev Reverts if caller is not a registered holder of the given property.
    ///      This is the ACCESS CONTROL gate — confidential token holding proves membership.
    modifier onlyHolder(uint256 propertyId) {
        if (!registry.isHolder(propertyId, msg.sender)) revert NotAHolder();
        _;
    }

    // ─── Proposal lifecycle ───────────────────────────────────────────────────

    /// @notice Create a governance proposal for a property you hold tokens in.
    /// @param propertyId   Property this proposal applies to.
    /// @param proposalType Category of the proposal.
    /// @param description  Human-readable description (stored on-chain for transparency).
    function createProposal(
        uint256 propertyId,
        ProposalType proposalType,
        string calldata description
    ) external onlyHolder(propertyId) returns (uint256 proposalId) {
        proposalId = ++proposalCount;
        uint256 deadline = block.timestamp + votingPeriod;

        proposals[proposalId] = Proposal({
            proposalId:   proposalId,
            propertyId:   propertyId,
            proposalType: proposalType,
            proposer:     msg.sender,
            description:  description,
            votingDeadline: deadline,
            forVotes:     0,
            againstVotes: 0,
            abstainVotes: 0,
            executed:     false,
            passed:       false
        });

        emit ProposalCreated(proposalId, propertyId, proposalType, msg.sender, description, deadline);
    }

    /// @notice Cast a vote on an active proposal.
    /// @dev    Each registered holder gets exactly 1 vote, regardless of encrypted balance.
    ///         Privacy guarantee: no observer can infer your token holdings from your vote.
    function castVote(
        uint256 proposalId,
        VoteOption option
    ) external {
        Proposal storage p = _getActiveProposal(proposalId);

        if (!registry.isHolder(p.propertyId, msg.sender)) revert NotAHolder();
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        hasVoted[proposalId][msg.sender] = true;
        voteRecord[proposalId][msg.sender] = option;

        if (option == VoteOption.For)         p.forVotes++;
        else if (option == VoteOption.Against) p.againstVotes++;
        else                                   p.abstainVotes++;

        emit VoteCast(proposalId, msg.sender, option);
    }

    /// @notice Finalize a proposal after its voting deadline has passed.
    /// @dev    Checks quorum and majority. Any address can call this.
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        if (p.proposalId == 0)   revert ProposalNotFound();
        if (p.executed)          revert AlreadyExecuted();
        if (block.timestamp <= p.votingDeadline) revert VotingStillOpen();

        uint256 totalHolders = registry.getHolderCount(p.propertyId);
        uint256 totalVotes   = p.forVotes + p.againstVotes + p.abstainVotes;

        // Quorum check: at least quorumNumerator% of holders must have voted
        if (totalHolders > 0 && (totalVotes * 100) / totalHolders < quorumNumerator) {
            revert QuorumNotReached();
        }

        p.executed = true;
        p.passed   = p.forVotes > p.againstVotes;

        emit ProposalFinalized(proposalId, p.passed, p.forVotes, p.againstVotes, p.abstainVotes);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    /// @notice Returns all proposals for a given property.
    function getProposalsByProperty(uint256 propertyId) external view returns (Proposal[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= proposalCount; i++) {
            if (proposals[i].propertyId == propertyId) count++;
        }
        Proposal[] memory result = new Proposal[](count);
        uint256 idx;
        for (uint256 i = 1; i <= proposalCount; i++) {
            if (proposals[i].propertyId == propertyId) result[idx++] = proposals[i];
        }
        return result;
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    function setVotingPeriod(uint256 newPeriod) external onlyOwner {
        votingPeriod = newPeriod;
    }

    function setQuorum(uint256 numerator) external onlyOwner {
        require(numerator <= 100, "Quorum > 100%");
        quorumNumerator = numerator;
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    function _getActiveProposal(uint256 proposalId) internal view returns (Proposal storage p) {
        p = proposals[proposalId];
        if (p.proposalId == 0)              revert ProposalNotFound();
        if (p.executed)                     revert AlreadyExecuted();
        if (block.timestamp > p.votingDeadline) revert VotingClosed();
    }
}
