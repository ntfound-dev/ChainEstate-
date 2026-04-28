import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying ChainEstate contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  let USDT_ADDRESS = process.env.USDT_ADDRESS || "";
  const TREASURY = process.env.TREASURY_ADDRESS || deployer.address;

  // ─── 0. Mock USDT (if no USDT_ADDRESS provided) ──────────────────────────
  if (!USDT_ADDRESS) {
    console.log("0/5  No USDT_ADDRESS set — deploying MockERC20 as USDT...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockUsdt = await MockERC20.deploy("Mock USDT", "USDT", 6);
    await mockUsdt.waitForDeployment();
    USDT_ADDRESS = await mockUsdt.getAddress();
    console.log("  ✓ MockERC20 (USDT):", USDT_ADDRESS);
    // Mint 10M USDT to deployer for testing
    await (mockUsdt as any).mint(deployer.address, ethers.parseUnits("10000000", 6));
    console.log("  ✓ Minted 10,000,000 USDT to deployer\n");
  }

  // ─── 1. CESTToken ────────────────────────────────────────────────────────
  console.log("1/5  Deploying CESTToken...");
  const CESTToken = await ethers.getContractFactory("CESTToken");
  const cestToken = await CESTToken.deploy(
    deployer.address, // ecosystem
    deployer.address, // airdrop
    deployer.address, // investor
    deployer.address, // team
    deployer.address  // reserve
  );
  await cestToken.waitForDeployment();
  const cestAddress = await cestToken.getAddress();
  console.log("  ✓ CESTToken:", cestAddress);

  // ─── 2. PropertyRegistry ─────────────────────────────────────────────────
  console.log("2/5  Deploying PropertyRegistry...");
  const PropertyRegistry = await ethers.getContractFactory("PropertyRegistry");
  const registry = await PropertyRegistry.deploy(USDT_ADDRESS);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("  ✓ PropertyRegistry:", registryAddress);

  // ─── 3. RentDistributor ──────────────────────────────────────────────────
  console.log("3/5  Deploying RentDistributor...");
  const RentDistributor = await ethers.getContractFactory("RentDistributor");
  const rentDistributor = await RentDistributor.deploy(
    registryAddress,
    USDT_ADDRESS,
    TREASURY
  );
  await rentDistributor.waitForDeployment();
  const rentDistributorAddress = await rentDistributor.getAddress();
  console.log("  ✓ RentDistributor:", rentDistributorAddress);

  // ─── 4. SecondaryMarket ──────────────────────────────────────────────────
  console.log("4/5  Deploying SecondaryMarket...");
  const SecondaryMarket = await ethers.getContractFactory("SecondaryMarket");
  const market = await SecondaryMarket.deploy(
    cestAddress,
    USDT_ADDRESS,
    TREASURY,
    registryAddress
  );
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("  ✓ SecondaryMarket:", marketAddress);

  // ─── 5. Wire up registry ─────────────────────────────────────────────────
  console.log("5/5  Wiring contracts...");
  let tx = await registry.setRentDistributor(rentDistributorAddress);
  await tx.wait();
  console.log("  ✓ Registry → RentDistributor linked");

  tx = await registry.setApprovedMarket(marketAddress, true);
  await tx.wait();
  console.log("  ✓ Registry → SecondaryMarket approved");

  // ─── 6. Seed demo property ───────────────────────────────────────────────
  console.log("\nSeeding demo property: The Pearl Residences, Dubai...");
  tx = await registry.listProperty(
    "The Pearl Residences",
    "Dubai, UAE",
    "QmPearlResidencesDubaiDemoHash123456789",
    500_000,
    1_000_000,        // 1 USDT (6 decimals)
    3_000_000_000     // 3,000 USDT monthly rent (6 decimals)
  );
  const receipt = await tx.wait();

  // Extract PropertyToken address from event
  const iface = registry.interface;
  let demoPropertyTokenAddress = "";
  for (const log of receipt!.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === "PropertyListed") {
        demoPropertyTokenAddress = parsed.args.tokenContract;
      }
    } catch {}
  }
  console.log("  ✓ Demo PropertyToken (Pearl Dubai):", demoPropertyTokenAddress);

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  ChainEstate Deployment Complete");
  console.log("═══════════════════════════════════════════════════");
  console.log("  CESTToken:           ", cestAddress);
  console.log("  PropertyRegistry:    ", registryAddress);
  console.log("  RentDistributor:     ", rentDistributorAddress);
  console.log("  SecondaryMarket:     ", marketAddress);
  console.log("  Demo PropertyToken:  ", demoPropertyTokenAddress);
  console.log("═══════════════════════════════════════════════════\n");

  // Save addresses to a JSON file for verify script
  const fs = await import("fs");
  const addresses = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
    cestToken: cestAddress,
    registry: registryAddress,
    rentDistributor: rentDistributorAddress,
    secondaryMarket: marketAddress,
    demoPropertyToken: demoPropertyTokenAddress,
    usdt: USDT_ADDRESS,
    mockUsdt: !process.env.USDT_ADDRESS ? USDT_ADDRESS : undefined,
    treasury: TREASURY,
  };
  fs.writeFileSync("deployments.json", JSON.stringify(addresses, null, 2));
  console.log("Addresses saved to deployments.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
