import { expect } from "chai";
import { ethers } from "hardhat";
import { SecondaryMarket, CESTToken, PropertyRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { setupMockNox } from "./helpers/setupNox";

describe("SecondaryMarket", () => {
  let market: SecondaryMarket;
  let cest: CESTToken;
  let registry: PropertyRegistry;
  let owner: SignerWithAddress;
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  let treasury: SignerWithAddress;

  let usdtAddress: string;
  let registryAddress: string;
  let propertyTokenAddress: string;

  const FAKE_HANDLE = ethers.ZeroHash;
  const FAKE_PROOF = ethers.toUtf8Bytes("test-proof");
  const TOKEN_PRICE = ethers.parseUnits("10", 6);  // 10 USDT per token
  const TOKEN_AMOUNT = 100n;

  beforeEach(async () => {
    await setupMockNox();
    [owner, seller, buyer, treasury] = await ethers.getSigners();

    // Deploy mock USDT
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdt = await MockERC20.deploy("Mock USDT", "USDT", 6);
    await usdt.waitForDeployment();
    usdtAddress = await usdt.getAddress();

    // Fund seller and buyer with USDT
    await (usdt as any).mint(seller.address, ethers.parseUnits("1000000", 6));
    await (usdt as any).mint(buyer.address, ethers.parseUnits("1000000", 6));

    // Deploy CEST
    const CESTFactory = await ethers.getContractFactory("CESTToken");
    cest = await CESTFactory.deploy(
      owner.address, owner.address, owner.address, owner.address, owner.address
    ) as CESTToken;
    await cest.waitForDeployment();

    // Deploy Registry
    const RegistryFactory = await ethers.getContractFactory("PropertyRegistry");
    registry = await RegistryFactory.deploy(usdtAddress) as PropertyRegistry;
    await registry.waitForDeployment();
    registryAddress = await registry.getAddress();

    // Deploy SecondaryMarket
    const MarketFactory = await ethers.getContractFactory("SecondaryMarket");
    market = await MarketFactory.deploy(
      await cest.getAddress(),
      usdtAddress,
      treasury.address,
      registryAddress
    ) as SecondaryMarket;
    await market.waitForDeployment();

    // Approve SecondaryMarket to register holders in the registry
    await registry.setApprovedMarket(await market.getAddress(), true);

    // List property to get PropertyToken
    const tx = await registry.listProperty(
      "Market Test Property", "Location", "Hash",
      10_000, 1_000_000, 1_000_000_000
    );
    const receipt = await tx.wait();
    for (const log of receipt!.logs) {
      try {
        const parsed = registry.interface.parseLog(log);
        if (parsed?.name === "PropertyListed") {
          propertyTokenAddress = parsed.args.tokenContract;
        }
      } catch {}
    }

    // Seller purchases tokens first
    await (usdt as any).connect(seller).approve(propertyTokenAddress, ethers.parseUnits("1000000", 6));
    const propToken = await ethers.getContractAt("PropertyToken", propertyTokenAddress);
    await propToken.connect(seller).purchaseTokens(FAKE_HANDLE, FAKE_PROOF, 1000);

    // Seller grants market as operator
    const expiry = (await time.latest()) + 365 * 24 * 60 * 60;
    await propToken.connect(seller).grantOperator(await market.getAddress(), expiry);
  });

  it("should create listing correctly", async () => {
    const tx = await market.connect(seller).createListing(
      propertyTokenAddress, 1, TOKEN_AMOUNT, TOKEN_PRICE
    );
    const receipt = await tx.wait();

    const event = receipt?.logs
      .map((log) => { try { return market.interface.parseLog(log); } catch { return null; } })
      .find((e) => e?.name === "ListingCreated");

    expect(event).to.not.be.null;
    expect(event!.args.seller).to.equal(seller.address);
    expect(event!.args.tokenAmount).to.equal(TOKEN_AMOUNT);
    expect(event!.args.pricePerToken).to.equal(TOKEN_PRICE);
  });

  it("should reject listing with zero token amount", async () => {
    await expect(
      market.connect(seller).createListing(propertyTokenAddress, 1, 0, TOKEN_PRICE)
    ).to.be.reverted;
  });

  it("should reject listing with zero price", async () => {
    await expect(
      market.connect(seller).createListing(propertyTokenAddress, 1, TOKEN_AMOUNT, 0)
    ).to.be.reverted;
  });

  it("should cancel listing and emit event", async () => {
    await market.connect(seller).createListing(propertyTokenAddress, 1, TOKEN_AMOUNT, TOKEN_PRICE);

    await expect(market.connect(seller).cancelListing(1))
      .to.emit(market, "ListingCancelled")
      .withArgs(1, seller.address);

    const listing = await market.listings(1);
    expect(listing.active).to.be.false;
  });

  it("should reject cancel from non-seller", async () => {
    await market.connect(seller).createListing(propertyTokenAddress, 1, TOKEN_AMOUNT, TOKEN_PRICE);
    await expect(market.connect(buyer).cancelListing(1)).to.be.reverted;
  });

  it("should reject buy of cancelled listing", async () => {
    await market.connect(seller).createListing(propertyTokenAddress, 1, TOKEN_AMOUNT, TOKEN_PRICE);
    await market.connect(seller).cancelListing(1);
    await expect(market.connect(buyer).executeBuy(1)).to.be.reverted;
  });

  it("should execute buy and transfer USDT to seller", async () => {
    await market.connect(seller).createListing(propertyTokenAddress, 1, TOKEN_AMOUNT, TOKEN_PRICE);

    const totalCost = TOKEN_AMOUNT * TOKEN_PRICE;
    await (await ethers.getContractAt("IERC20", usdtAddress))
      .connect(buyer)
      .approve(await market.getAddress(), totalCost);

    const sellerBefore = await (await ethers.getContractAt("IERC20", usdtAddress)).balanceOf(seller.address);
    await market.connect(buyer).executeBuy(1);
    const sellerAfter = await (await ethers.getContractAt("IERC20", usdtAddress)).balanceOf(seller.address);

    // Seller receives totalCost minus 0.5% fee
    const expectedFee = (totalCost * 50n) / 10000n;
    expect(sellerAfter - sellerBefore).to.equal(totalCost - expectedFee);
  });

  it("should deduct 0.5% trading fee to treasury", async () => {
    await market.connect(seller).createListing(propertyTokenAddress, 1, TOKEN_AMOUNT, TOKEN_PRICE);

    const totalCost = TOKEN_AMOUNT * TOKEN_PRICE;
    await (await ethers.getContractAt("IERC20", usdtAddress))
      .connect(buyer)
      .approve(await market.getAddress(), totalCost);

    const treasuryBefore = await (await ethers.getContractAt("IERC20", usdtAddress)).balanceOf(treasury.address);
    await market.connect(buyer).executeBuy(1);
    const treasuryAfter = await (await ethers.getContractAt("IERC20", usdtAddress)).balanceOf(treasury.address);

    const expectedFee = (totalCost * 50n) / 10000n;
    expect(treasuryAfter - treasuryBefore).to.equal(expectedFee);
  });

  it("should apply CEST holder fee discount (PLATINUM = 100% off)", async () => {
    // Give buyer PLATINUM CEST status
    const platinumAmount = ethers.parseEther("200000");
    await cest.transfer(buyer.address, platinumAmount);
    await cest.connect(buyer).approve(await cest.getAddress(), platinumAmount);
    await cest.connect(buyer).stake(platinumAmount, 365);

    await market.connect(seller).createListing(propertyTokenAddress, 1, TOKEN_AMOUNT, TOKEN_PRICE);

    const totalCost = TOKEN_AMOUNT * TOKEN_PRICE;
    await (await ethers.getContractAt("IERC20", usdtAddress))
      .connect(buyer)
      .approve(await market.getAddress(), totalCost);

    const treasuryBefore = await (await ethers.getContractAt("IERC20", usdtAddress)).balanceOf(treasury.address);
    await market.connect(buyer).executeBuy(1);
    const treasuryAfter = await (await ethers.getContractAt("IERC20", usdtAddress)).balanceOf(treasury.address);

    // PLATINUM = 100% discount → zero fee to treasury
    expect(treasuryAfter - treasuryBefore).to.equal(0n);
  });

  it("should return only active listings for a property", async () => {
    await market.connect(seller).createListing(propertyTokenAddress, 1, TOKEN_AMOUNT, TOKEN_PRICE);
    await market.connect(seller).createListing(propertyTokenAddress, 1, TOKEN_AMOUNT, TOKEN_PRICE);
    await market.connect(seller).cancelListing(1);

    const listings = await market.getListingsByProperty(1);
    expect(listings.length).to.equal(1);
    expect(listings[0].listingId).to.equal(2n);
  });

  it("should return all active listings from getAllActiveListings", async () => {
    await market.connect(seller).createListing(propertyTokenAddress, 1, TOKEN_AMOUNT, TOKEN_PRICE);
    await market.connect(seller).createListing(propertyTokenAddress, 1, TOKEN_AMOUNT, TOKEN_PRICE);

    const all = await market.getAllActiveListings();
    expect(all.length).to.equal(2);
  });

  it("should allow owner to set trading fee", async () => {
    await market.setTradingFee(100); // 1%
    expect(await market.tradingFeeBps()).to.equal(100n);
  });

  it("should reject trading fee above 10%", async () => {
    await expect(market.setTradingFee(1001)).to.be.reverted;
  });
});
