import { expect } from "chai";
import { ethers } from "hardhat";
import { PropertyRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PropertyRegistry", () => {
  let registry: PropertyRegistry;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let mockUsdt: string;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy a minimal ERC-20 mock for USDT
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdt = await MockERC20.deploy("Mock USDT", "USDT", 6);
    await usdt.waitForDeployment();
    mockUsdt = await usdt.getAddress();

    const Factory = await ethers.getContractFactory("PropertyRegistry");
    registry = await Factory.deploy(mockUsdt) as PropertyRegistry;
    await registry.waitForDeployment();
  });

  it("should initialize with correct USDT address", async () => {
    expect(await registry.usdtToken()).to.equal(mockUsdt);
  });

  it("should list a property and return non-zero propertyId and tokenContract", async () => {
    const tx = await registry.listProperty(
      "Pearl Residences",
      "Dubai, UAE",
      "QmTestHash",
      500_000,
      1_000_000,
      3_000_000_000
    );
    const receipt = await tx.wait();

    const event = receipt?.logs
      .map((log) => {
        try { return registry.interface.parseLog(log); } catch { return null; }
      })
      .find((e) => e?.name === "PropertyListed");

    expect(event).to.not.be.null;
    expect(event!.args.propertyId).to.equal(1n);
    expect(event!.args.tokenContract).to.not.equal(ethers.ZeroAddress);
  });

  it("should increment propertyCount after each listing", async () => {
    await registry.listProperty("P1", "Loc1", "Hash1", 100, 1_000_000, 1_000_000);
    await registry.listProperty("P2", "Loc2", "Hash2", 200, 2_000_000, 2_000_000);
    expect(await registry.propertyCount()).to.equal(2n);
  });

  it("should return correct property details from getProperty", async () => {
    await registry.listProperty(
      "Test Property",
      "Test Location",
      "TestHash",
      1000,
      500_000,
      500_000
    );

    const prop = await registry.getProperty(1);
    expect(prop.name).to.equal("Test Property");
    expect(prop.location).to.equal("Test Location");
    expect(prop.totalSupply).to.equal(1000n);
    expect(prop.pricePerToken).to.equal(500_000n);
  });

  it("should revert when getting a non-existent property", async () => {
    await expect(registry.getProperty(999)).to.be.reverted;
  });

  it("should only allow owner to list property", async () => {
    await expect(
      registry.connect(user).listProperty("P", "L", "H", 100, 1_000_000, 1_000_000)
    ).to.be.reverted;
  });

  it("should only allow owner to set property status", async () => {
    await registry.listProperty("P", "L", "H", 100, 1_000_000, 1_000_000);
    await expect(
      registry.connect(user).setPropertyStatus(1, 4) // INACTIVE
    ).to.be.reverted;
  });

  it("should update property status when called by owner", async () => {
    await registry.listProperty("P", "L", "H", 100, 1_000_000, 1_000_000);
    await registry.setPropertyStatus(1, 4); // INACTIVE
    const prop = await registry.getProperty(1);
    expect(prop.status).to.equal(4n);
  });

  it("should register a holder only from the property token contract", async () => {
    await registry.listProperty("P", "L", "H", 100, 1_000_000, 1_000_000);
    // Calling directly (not from token contract) should revert
    await expect(
      registry.registerHolder(1, user.address)
    ).to.be.reverted;
  });

  it("should set RentDistributor and only owner can do it", async () => {
    const fakeAddress = ethers.Wallet.createRandom().address;
    await registry.setRentDistributor(fakeAddress);
    expect(await registry.rentDistributor()).to.equal(fakeAddress);

    await expect(registry.connect(user).setRentDistributor(fakeAddress)).to.be.reverted;
  });

  it("should return empty active properties when none are active", async () => {
    await registry.listProperty("P", "L", "H", 100, 1_000_000, 1_000_000);
    await registry.setPropertyStatus(1, 4); // INACTIVE

    const active = await registry.getActiveProperties();
    expect(active.length).to.equal(0);
  });

  it("should return only active properties from getActiveProperties", async () => {
    await registry.listProperty("P1", "L1", "H1", 100, 1_000_000, 1_000_000);
    await registry.listProperty("P2", "L2", "H2", 200, 2_000_000, 2_000_000);
    await registry.setPropertyStatus(1, 4); // INACTIVE

    const active = await registry.getActiveProperties();
    expect(active.length).to.equal(1);
    expect(active[0].name).to.equal("P2");
  });
});
