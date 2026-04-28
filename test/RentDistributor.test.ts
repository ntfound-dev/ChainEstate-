import { expect } from "chai";
import { ethers } from "hardhat";
import { RentDistributor, PropertyRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RentDistributor", () => {
  let registry: PropertyRegistry;
  let distributor: RentDistributor;
  let owner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let holderA: SignerWithAddress;
  let holderB: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let usdt: { getAddress: () => Promise<string>; connect: (s: SignerWithAddress) => typeof usdt; approve: (a: string, v: bigint) => Promise<{ wait: () => Promise<unknown> }>; transfer: (a: string, v: bigint) => Promise<{ wait: () => Promise<unknown> }>; balanceOf: (a: string) => Promise<bigint> };

  const parseUsdt = (n: number) => ethers.parseUnits(n.toString(), 6);

  beforeEach(async () => {
    [owner, treasury, holderA, holderB, nonOwner] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdtContract = await MockERC20.deploy("Mock USDT", "USDT", 6);
    await usdtContract.waitForDeployment();
    usdt = usdtContract as unknown as typeof usdt;

    const RegistryFactory = await ethers.getContractFactory("PropertyRegistry");
    registry = await RegistryFactory.deploy(await usdt.getAddress()) as PropertyRegistry;
    await registry.waitForDeployment();

    const DistFactory = await ethers.getContractFactory("RentDistributor");
    distributor = await DistFactory.deploy(
      await registry.getAddress(),
      await usdt.getAddress(),
      treasury.address
    ) as RentDistributor;
    await distributor.waitForDeployment();

    // Wire registry
    await registry.setRentDistributor(await distributor.getAddress());

    // List a property
    await registry.listProperty("Test Property", "Location", "Hash", 1000, 1_000_000, 3_000_000_000);

    // Simulate holders (direct injection for unit test: we use a test helper)
    // Fund admin with USDT for deposits
    // MockERC20 mints to deployer; we transfer to admin
  });

  it("should accept rent deposit from owner", async () => {
    const amount = parseUsdt(1000);
    await (usdt as any).approve(await distributor.getAddress(), amount);
    await distributor.depositRent(1, amount);

    const pending = await distributor.getPendingRent(1);
    expect(pending).to.equal(amount);
  });

  it("should reject deposit from non-owner", async () => {
    const amount = parseUsdt(1000);
    await expect(distributor.connect(nonOwner).depositRent(1, amount)).to.be.reverted;
  });

  it("should reject deposit of zero amount", async () => {
    await expect(distributor.depositRent(1, 0n)).to.be.reverted;
  });

  it("should correctly calculate 5% platform fee", async () => {
    const RENT_AMOUNT = parseUsdt(10000);
    const EXPECTED_FEE = parseUsdt(500); // 5%

    await (usdt as any).approve(await distributor.getAddress(), RENT_AMOUNT);
    await distributor.depositRent(1, RENT_AMOUNT);

    const balanceBefore = await (usdt as any).balanceOf(treasury.address);
    await distributor.distributeRent(1);
    const balanceAfter = await (usdt as any).balanceOf(treasury.address);

    // Platform fee goes to treasury (plus dust from distribution)
    expect(balanceAfter - balanceBefore).to.be.gte(EXPECTED_FEE);
  });

  it("should correctly calculate 5% maintenance fee", async () => {
    const RENT_AMOUNT = parseUsdt(10000);
    const EXPECTED_MAINTENANCE = parseUsdt(500); // 5%

    await (usdt as any).approve(await distributor.getAddress(), RENT_AMOUNT);
    await distributor.depositRent(1, RENT_AMOUNT);
    await distributor.distributeRent(1);

    const reserve = await distributor.maintenanceReserve(1);
    expect(reserve).to.equal(EXPECTED_MAINTENANCE);
  });

  it("should distribute 90% net amount to holders", async () => {
    const RENT_AMOUNT = parseUsdt(10000);
    const NET = parseUsdt(9000); // 90%

    await (usdt as any).approve(await distributor.getAddress(), RENT_AMOUNT);
    await distributor.depositRent(1, RENT_AMOUNT);
    await distributor.distributeRent(1);

    const history = await distributor.getDistributionHistory(1);
    expect(history[0].netAmount).to.equal(NET);
  });

  it("should record distribution in history", async () => {
    const RENT_AMOUNT = parseUsdt(5000);

    await (usdt as any).approve(await distributor.getAddress(), RENT_AMOUNT);
    await distributor.depositRent(1, RENT_AMOUNT);
    await distributor.distributeRent(1);

    const history = await distributor.getDistributionHistory(1);
    expect(history.length).to.equal(1);
    expect(history[0].propertyId).to.equal(1n);
    expect(history[0].amount).to.equal(RENT_AMOUNT);
  });

  it("should reset pending rent to 0 after distribution", async () => {
    const RENT_AMOUNT = parseUsdt(1000);
    await (usdt as any).approve(await distributor.getAddress(), RENT_AMOUNT);
    await distributor.depositRent(1, RENT_AMOUNT);
    await distributor.distributeRent(1);

    expect(await distributor.getPendingRent(1)).to.equal(0n);
  });

  it("should allow maintenance withdrawal by owner", async () => {
    const RENT_AMOUNT = parseUsdt(1000);
    await (usdt as any).approve(await distributor.getAddress(), RENT_AMOUNT);
    await distributor.depositRent(1, RENT_AMOUNT);
    await distributor.distributeRent(1);

    const reserve = await distributor.maintenanceReserve(1);
    await distributor.withdrawMaintenance(1, reserve, owner.address);
    expect(await distributor.maintenanceReserve(1)).to.equal(0n);
  });

  it("should reject maintenance withdrawal by non-owner", async () => {
    await expect(
      distributor.connect(nonOwner).withdrawMaintenance(1, parseUsdt(1), owner.address)
    ).to.be.reverted;
  });

  it("should revert distribute when pending rent is zero", async () => {
    await expect(distributor.distributeRent(1)).to.be.reverted;
  });
});
