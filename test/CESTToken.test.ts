import { expect } from "chai";
import { ethers } from "hardhat";
import { CESTToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("CESTToken", () => {
  let cest: CESTToken;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let other: SignerWithAddress;

  const WALLETS = () => [owner.address, owner.address, owner.address, owner.address, owner.address];
  const toE18 = (n: number) => ethers.parseEther(n.toString());

  beforeEach(async () => {
    [owner, user, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CESTToken");
    cest = await Factory.deploy(...WALLETS()) as CESTToken;
    await cest.waitForDeployment();
  });

  it("should mint correct total supply at deployment", async () => {
    const total = await cest.totalSupply();
    expect(total).to.equal(ethers.parseEther("1000000000")); // 1 Billion
  });

  it("should allocate correct supply per category", async () => {
    // All minted to owner in this test setup
    const ownerBalance = await cest.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("1000000000"));
  });

  it("should stake and assign correct BRONZE tier", async () => {
    await cest.transfer(user.address, toE18(1000));
    await cest.connect(user).approve(await cest.getAddress(), toE18(1000));
    await cest.connect(user).stake(toE18(1000), 30);

    const tier = await cest.getTier(user.address);
    expect(tier).to.equal(1); // BRONZE = 1
  });

  it("should assign SILVER tier at 10,000 CEST staked", async () => {
    await cest.transfer(user.address, toE18(10000));
    await cest.connect(user).approve(await cest.getAddress(), toE18(10000));
    await cest.connect(user).stake(toE18(10000), 30);

    const tier = await cest.getTier(user.address);
    expect(tier).to.equal(2); // SILVER = 2
  });

  it("should assign GOLD tier at 50,000 CEST staked", async () => {
    await cest.transfer(user.address, toE18(50000));
    await cest.connect(user).approve(await cest.getAddress(), toE18(50000));
    await cest.connect(user).stake(toE18(50000), 90);

    const tier = await cest.getTier(user.address);
    expect(tier).to.equal(3); // GOLD = 3
  });

  it("should assign PLATINUM tier at 200,000 CEST staked", async () => {
    await cest.transfer(user.address, toE18(200000));
    await cest.connect(user).approve(await cest.getAddress(), toE18(200000));
    await cest.connect(user).stake(toE18(200000), 365);

    const tier = await cest.getTier(user.address);
    expect(tier).to.equal(4); // PLATINUM = 4
  });

  it("should not allow unstake before lock period", async () => {
    await cest.transfer(user.address, toE18(1000));
    await cest.connect(user).approve(await cest.getAddress(), toE18(1000));
    await cest.connect(user).stake(toE18(1000), 30);

    await expect(cest.connect(user).unstake(toE18(1000))).to.be.reverted;
  });

  it("should allow unstake after lock period ends", async () => {
    await cest.transfer(user.address, toE18(1000));
    await cest.connect(user).approve(await cest.getAddress(), toE18(1000));
    await cest.connect(user).stake(toE18(1000), 30);

    await time.increase(30 * 24 * 60 * 60 + 1); // 30 days + 1 second

    await expect(cest.connect(user).unstake(toE18(1000))).to.not.be.reverted;
    const tierAfter = await cest.getTier(user.address);
    expect(tierAfter).to.equal(0); // NONE
  });

  it("should return correct fee discount per tier", async () => {
    // NONE = 0 bps
    expect(await cest.getFeeDiscount(other.address)).to.equal(0);

    // BRONZE = 1000 bps
    await cest.transfer(user.address, toE18(1000));
    await cest.connect(user).approve(await cest.getAddress(), toE18(1000));
    await cest.connect(user).stake(toE18(1000), 30);
    expect(await cest.getFeeDiscount(user.address)).to.equal(1000);
  });

  it("should return 10000 bps discount (100% free) for PLATINUM", async () => {
    await cest.transfer(user.address, toE18(200000));
    await cest.connect(user).approve(await cest.getAddress(), toE18(200000));
    await cest.connect(user).stake(toE18(200000), 365);
    expect(await cest.getFeeDiscount(user.address)).to.equal(10000);
  });

  it("should upgrade tier when more CEST is staked", async () => {
    await cest.transfer(user.address, toE18(11000));
    await cest.connect(user).approve(await cest.getAddress(), toE18(11000));

    await cest.connect(user).stake(toE18(1000), 30);
    expect(await cest.getTier(user.address)).to.equal(1); // BRONZE

    await time.increase(31 * 24 * 60 * 60);
    await cest.connect(user).unstake(toE18(1000));

    await cest.connect(user).approve(await cest.getAddress(), toE18(10000));
    await cest.connect(user).stake(toE18(10000), 30);
    expect(await cest.getTier(user.address)).to.equal(2); // SILVER
  });

  it("should reject stake with invalid lock days", async () => {
    await cest.transfer(user.address, toE18(1000));
    await cest.connect(user).approve(await cest.getAddress(), toE18(1000));
    await expect(cest.connect(user).stake(toE18(1000), 10)).to.be.reverted; // < 30 days
    await expect(cest.connect(user).stake(toE18(1000), 400)).to.be.reverted; // > 365 days
  });
});
