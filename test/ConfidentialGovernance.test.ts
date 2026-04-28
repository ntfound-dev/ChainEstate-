import { expect } from "chai";
import { ethers } from "hardhat";
import { ConfidentialGovernance, PropertyRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { setupMockNox } from "./helpers/setupNox";

describe("ConfidentialGovernance", () => {
  let governance: ConfidentialGovernance;
  let registry: PropertyRegistry;
  let owner: SignerWithAddress;
  let holder1: SignerWithAddress;
  let holder2: SignerWithAddress;
  let nonHolder: SignerWithAddress;

  let propertyId: bigint;
  const FAKE_HANDLE = ethers.ZeroHash;
  const FAKE_PROOF  = ethers.toUtf8Bytes("test-proof");

  beforeEach(async () => {
    await setupMockNox();
    [owner, holder1, holder2, nonHolder] = await ethers.getSigners();

    // Deploy mock USDT
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdt = await MockERC20.deploy("Mock USDT", "USDT", 6);
    await usdt.waitForDeployment();
    const usdtAddress = await usdt.getAddress();

    // Fund holders
    await (usdt as any).mint(holder1.address, ethers.parseUnits("1000000", 6));
    await (usdt as any).mint(holder2.address, ethers.parseUnits("1000000", 6));

    // Deploy Registry
    const RegistryFactory = await ethers.getContractFactory("PropertyRegistry");
    registry = await RegistryFactory.deploy(usdtAddress) as PropertyRegistry;
    await registry.waitForDeployment();

    // Deploy Governance
    const GovFactory = await ethers.getContractFactory("ConfidentialGovernance");
    governance = await GovFactory.deploy(await registry.getAddress()) as ConfidentialGovernance;
    await governance.waitForDeployment();

    // List a property
    const tx = await registry.listProperty("Gov Test Property", "Location", "Hash", 10_000, 1_000_000, 1_000_000_000);
    const receipt = await tx.wait();
    let tokenAddress = "";
    for (const log of receipt!.logs) {
      try {
        const parsed = registry.interface.parseLog(log);
        if (parsed?.name === "PropertyListed") {
          propertyId = parsed.args.propertyId;
          tokenAddress = parsed.args.tokenContract;
        }
      } catch {}
    }

    // holder1 and holder2 purchase tokens (registers them as holders)
    const propToken = await ethers.getContractAt("PropertyToken", tokenAddress);
    await (usdt as any).connect(holder1).approve(tokenAddress, ethers.parseUnits("1000000", 6));
    await (usdt as any).connect(holder2).approve(tokenAddress, ethers.parseUnits("1000000", 6));
    await propToken.connect(holder1).purchaseTokens(FAKE_HANDLE, FAKE_PROOF, 100);
    await propToken.connect(holder2).purchaseTokens(FAKE_HANDLE, FAKE_PROOF, 50);
  });

  it("should allow a token holder to create a proposal", async () => {
    const tx = await governance.connect(holder1).createProposal(
      propertyId, 0, "Increase monthly rent by 10%"
    );
    const receipt = await tx.wait();
    const event = receipt?.logs
      .map(l => { try { return governance.interface.parseLog(l); } catch { return null; } })
      .find(e => e?.name === "ProposalCreated");

    expect(event).to.not.be.null;
    expect(event!.args.propertyId).to.equal(propertyId);
    expect(event!.args.proposer).to.equal(holder1.address);
  });

  it("should reject proposal creation from non-holder", async () => {
    await expect(
      governance.connect(nonHolder).createProposal(propertyId, 0, "Unauthorized proposal")
    ).to.be.revertedWithCustomError(governance, "NotAHolder");
  });

  it("should allow holders to cast votes", async () => {
    await governance.connect(holder1).createProposal(propertyId, 0, "Maintenance work approval");

    await governance.connect(holder1).castVote(1, 1); // For
    await governance.connect(holder2).castVote(1, 1); // For

    const proposal = await governance.getProposal(1);
    expect(proposal.forVotes).to.equal(2n);
    expect(proposal.againstVotes).to.equal(0n);
  });

  it("should reject vote from non-holder", async () => {
    await governance.connect(holder1).createProposal(propertyId, 0, "Test");
    await expect(
      governance.connect(nonHolder).castVote(1, 1)
    ).to.be.revertedWithCustomError(governance, "NotAHolder");
  });

  it("should reject double voting", async () => {
    await governance.connect(holder1).createProposal(propertyId, 0, "Test");
    await governance.connect(holder1).castVote(1, 1);
    await expect(
      governance.connect(holder1).castVote(1, 0)
    ).to.be.revertedWithCustomError(governance, "AlreadyVoted");
  });

  it("should reject vote after deadline", async () => {
    await governance.connect(holder1).createProposal(propertyId, 0, "Test");
    await time.increase(4 * 24 * 60 * 60); // 4 days
    await expect(
      governance.connect(holder1).castVote(1, 1)
    ).to.be.revertedWithCustomError(governance, "VotingClosed");
  });

  it("should finalize proposal as passed when majority votes For", async () => {
    await governance.setQuorum(0);
    await governance.connect(holder1).createProposal(propertyId, 0, "Test proposal");
    await governance.connect(holder1).castVote(1, 1); // For
    await governance.connect(holder2).castVote(1, 1); // For

    await time.increase(4 * 24 * 60 * 60);
    await governance.finalizeProposal(1);

    const proposal = await governance.getProposal(1);
    expect(proposal.executed).to.be.true;
    expect(proposal.passed).to.be.true;
  });

  it("should finalize proposal as failed when majority votes Against", async () => {
    await governance.setQuorum(0);
    await governance.connect(holder1).createProposal(propertyId, 0, "Bad proposal");
    await governance.connect(holder1).castVote(1, 0); // Against
    await governance.connect(holder2).castVote(1, 0); // Against

    await time.increase(4 * 24 * 60 * 60);
    await governance.finalizeProposal(1);

    const proposal = await governance.getProposal(1);
    expect(proposal.executed).to.be.true;
    expect(proposal.passed).to.be.false;
  });

  it("should revert finalize if voting still open", async () => {
    await governance.connect(holder1).createProposal(propertyId, 0, "Test");
    await expect(governance.finalizeProposal(1))
      .to.be.revertedWithCustomError(governance, "VotingStillOpen");
  });

  it("should revert finalize if quorum not reached", async () => {
    // Default quorum is 20%, 2 holders = need at least 1 vote = 50% — but no one votes
    await governance.connect(holder1).createProposal(propertyId, 0, "No votes");
    await time.increase(4 * 24 * 60 * 60);
    await expect(governance.finalizeProposal(1))
      .to.be.revertedWithCustomError(governance, "QuorumNotReached");
  });

  it("should return proposals by property", async () => {
    await governance.connect(holder1).createProposal(propertyId, 0, "Proposal 1");
    await governance.connect(holder2).createProposal(propertyId, 1, "Proposal 2");

    const props = await governance.getProposalsByProperty(propertyId);
    expect(props.length).to.equal(2);
  });

  it("should verify isHolder correctly via registry", async () => {
    expect(await registry.isHolder(propertyId, holder1.address)).to.be.true;
    expect(await registry.isHolder(propertyId, nonHolder.address)).to.be.false;
  });

  it("should return correct holder count", async () => {
    expect(await registry.getHolderCount(propertyId)).to.equal(2n);
  });
});
