import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Local deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 1. Deploy Mock USDT (local only)
  console.log("0. Deploying Mock USDT...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdt = await MockERC20.deploy("Mock USDT", "USDT", 6);
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("  ✓ MockUSDT:", usdtAddress);

  const TREASURY = deployer.address;

  // 2. CESTToken
  console.log("1. Deploying CESTToken...");
  const CESTToken = await ethers.getContractFactory("CESTToken");
  const cest = await CESTToken.deploy(
    deployer.address, deployer.address, deployer.address, deployer.address, deployer.address
  );
  await cest.waitForDeployment();
  const cestAddress = await cest.getAddress();
  console.log("  ✓ CESTToken:", cestAddress);

  // 3. PropertyRegistry
  console.log("2. Deploying PropertyRegistry...");
  const Registry = await ethers.getContractFactory("PropertyRegistry");
  const registry = await Registry.deploy(usdtAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("  ✓ PropertyRegistry:", registryAddress);

  // 4. RentDistributor
  console.log("3. Deploying RentDistributor...");
  const RentDist = await ethers.getContractFactory("RentDistributor");
  const rentDistributor = await RentDist.deploy(registryAddress, usdtAddress, TREASURY);
  await rentDistributor.waitForDeployment();
  const rentDistributorAddress = await rentDistributor.getAddress();
  console.log("  ✓ RentDistributor:", rentDistributorAddress);

  // 5. SecondaryMarket
  console.log("4. Deploying SecondaryMarket...");
  const Market = await ethers.getContractFactory("SecondaryMarket");
  const market = await Market.deploy(cestAddress, usdtAddress, TREASURY, registryAddress);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("  ✓ SecondaryMarket:", marketAddress);

  // 6. Wire
  console.log("5. Wiring contracts...");
  await (await registry.setRentDistributor(rentDistributorAddress)).wait();
  await (await registry.setApprovedMarket(marketAddress, true)).wait();
  console.log("  ✓ Registry wired");

  // 7. List demo property
  console.log("6. Listing demo property: The Pearl Residences, Dubai...");
  const tx = await registry.listProperty(
    "The Pearl Residences", "Dubai, UAE",
    "QmPearlResidencesDemoHash", 500_000, 1_000_000, 3_000_000_000
  );
  const receipt = await tx.wait();
  let tokenAddr = "";
  for (const log of receipt!.logs) {
    try {
      const parsed = registry.interface.parseLog(log);
      if (parsed?.name === "PropertyListed") tokenAddr = parsed.args.tokenContract;
    } catch {}
  }
  console.log("  ✓ Demo PropertyToken:", tokenAddr);

  const addresses = {
    network: "localhost",
    chainId: 31337,
    deployedAt: new Date().toISOString(),
    mockUsdt: usdtAddress,
    cestToken: cestAddress,
    registry: registryAddress,
    rentDistributor: rentDistributorAddress,
    secondaryMarket: marketAddress,
    demoPropertyToken: tokenAddr,
    usdt: usdtAddress,
    treasury: TREASURY,
  };

  const fs = await import("fs");
  fs.writeFileSync("deployments.local.json", JSON.stringify(addresses, null, 2));

  console.log("\n═══════════════════════════════════════════════════");
  console.log("  Local Deployment Complete");
  console.log("═══════════════════════════════════════════════════");
  Object.entries(addresses).forEach(([k, v]) => {
    if (typeof v === 'string' && v.startsWith('0x')) console.log(`  ${k.padEnd(22)} ${v}`);
  });
  console.log("═══════════════════════════════════════════════════");
  console.log("  Saved to deployments.local.json");
}

main().catch(e => { console.error(e); process.exit(1); });
