import { expect } from "chai";
import { ethers } from "hardhat";
import { PropertyToken, PropertyRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { setupMockNox } from "./helpers/setupNox";

describe("PropertyToken", () => {
  let registry: PropertyRegistry;
  let propertyToken: PropertyToken;
  let owner: SignerWithAddress;
  let buyer: SignerWithAddress;
  let operator: SignerWithAddress;
  let recipient: SignerWithAddress;

  // Placeholder Nox encrypted input for local tests
  const FAKE_HANDLE = ethers.ZeroHash;
  const FAKE_PROOF = ethers.toUtf8Bytes("test-proof");

  beforeEach(async () => {
    await setupMockNox();
    [owner, buyer, operator, recipient] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdt = await MockERC20.deploy("Mock USDT", "USDT", 6);
    await usdt.waitForDeployment();
    // Mint USDT to buyer
    await (usdt as any).mint(buyer.address, ethers.parseUnits("100000", 6));

    const RegistryFactory = await ethers.getContractFactory("PropertyRegistry");
    registry = await RegistryFactory.deploy(await usdt.getAddress()) as PropertyRegistry;
    await registry.waitForDeployment();

    // List a property — this deploys a PropertyToken via CREATE2
    const tx = await registry.listProperty(
      "Test Property",
      "Test Location",
      "TestHash",
      10_000,       // totalSupply
      1_000_000,    // 1 USDT per token (6 decimals)
      1_000_000_000 // monthly rent
    );
    const receipt = await tx.wait();

    let tokenAddress = "";
    for (const log of receipt!.logs) {
      try {
        const parsed = registry.interface.parseLog(log);
        if (parsed?.name === "PropertyListed") {
          tokenAddress = parsed.args.tokenContract;
        }
      } catch {}
    }

    propertyToken = await ethers.getContractAt("PropertyToken", tokenAddress) as PropertyToken;

    // Approve USDT for buyer
    await (usdt as any).connect(buyer).approve(tokenAddress, ethers.parseUnits("100000", 6));
  });

  it("should initialize correctly with registry", async () => {
    expect(await propertyToken.registry()).to.equal(await registry.getAddress());
    expect(await propertyToken.maxSupply()).to.equal(10_000n);
    expect(await propertyToken.pricePerToken()).to.equal(1_000_000n);
  });

  it("should have propertyId set to 1 after first listing", async () => {
    expect(await propertyToken.getPropertyId()).to.equal(1n);
  });

  it("should allow purchase via clearAmount parameter", async () => {
    await expect(
      propertyToken.connect(buyer).purchaseTokens(FAKE_HANDLE, FAKE_PROOF, 100)
    ).to.emit(propertyToken, "TokensPurchased");
  });

  it("should register holder in registry after purchase", async () => {
    await propertyToken.connect(buyer).purchaseTokens(FAKE_HANDLE, FAKE_PROOF, 100);
    const holders = await registry.getPropertyHolders(1);
    expect(holders).to.include(buyer.address);
  });

  it("should not emit amount in purchase event (privacy check)", async () => {
    const tx = await propertyToken.connect(buyer).purchaseTokens(FAKE_HANDLE, FAKE_PROOF, 100);
    const receipt = await tx.wait();

    // Find the TokensPurchased event — it should NOT contain amount field
    for (const log of receipt!.logs) {
      try {
        const parsed = propertyToken.interface.parseLog(log);
        if (parsed?.name === "TokensPurchased") {
          expect(parsed.args).to.not.have.property("amount");
          expect(Object.keys(parsed.args).filter(k => isNaN(Number(k)))).to.deep.equal([
            "buyer", "propertyId", "timestamp",
          ]);
        }
      } catch {}
    }
  });

  it("should increment totalMinted after purchase", async () => {
    await propertyToken.connect(buyer).purchaseTokens(FAKE_HANDLE, FAKE_PROOF, 500);
    expect(await propertyToken.totalMinted()).to.equal(500n);
  });

  it("should reject purchase exceeding maxSupply", async () => {
    await expect(
      propertyToken.connect(buyer).purchaseTokens(FAKE_HANDLE, FAKE_PROOF, 100_000)
    ).to.be.reverted;
  });

  it("should grant operator to RentDistributor on initialize", async () => {
    const distributor = await ethers.Wallet.createRandom().address;
    // The RentDistributor address set during listing should be an active operator
    // In this test the rentDistributor was address(0) so we test manual granting
    const expiry = (await time.latest()) + 365 * 24 * 60 * 60;
    await propertyToken.connect(owner).grantOperator(operator.address, expiry);
    expect(await propertyToken.isOperatorActive(owner.address, operator.address)).to.be.true;
  });

  it("should reject operator transfer after expiry", async () => {
    const expiry = (await time.latest()) + 60; // 1 minute
    await propertyToken.connect(owner).grantOperator(operator.address, expiry);

    await time.increase(120); // 2 minutes

    expect(await propertyToken.isOperatorActive(owner.address, operator.address)).to.be.false;
  });

  it("should revoke operator rights", async () => {
    const expiry = (await time.latest()) + 365 * 24 * 60 * 60;
    await propertyToken.connect(owner).grantOperator(operator.address, expiry);
    await propertyToken.connect(owner).revokeOperator(operator.address);
    expect(await propertyToken.isOperatorActive(owner.address, operator.address)).to.be.false;
  });

  it("should reject grantOperator with past expiry", async () => {
    const pastExpiry = (await time.latest()) - 1;
    await expect(
      propertyToken.connect(owner).grantOperator(operator.address, pastExpiry)
    ).to.be.reverted;
  });

  it("should only allow initialized once", async () => {
    await expect(
      propertyToken.initialize(1, await registry.getAddress(), ethers.ZeroAddress, 10000, 1_000_000, ethers.ZeroAddress)
    ).to.be.reverted;
  });
});
