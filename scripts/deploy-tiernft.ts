import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying TierNFT with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Read existing deployment addresses
  const deployments = JSON.parse(fs.readFileSync("deployments.json", "utf8"));
  const cestAddress     = deployments.cestToken;
  const registryAddress = deployments.registry;
  const treasury        = deployments.treasury || deployer.address;

  console.log("Using:");
  console.log("  CESTToken:        ", cestAddress);
  console.log("  PropertyRegistry: ", registryAddress);
  console.log("  Treasury:         ", treasury);
  console.log("");

  // Force correct nonce from network (bypass Hardhat's stale local cache)
  const nonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  console.log("On-chain nonce:", nonce);

  console.log("Deploying TierNFT...");
  const TierNFT = await ethers.getContractFactory("TierNFT");
  const tierNFT = await TierNFT.deploy(
    cestAddress,
    registryAddress,
    treasury,
    deployer.address,
    { nonce }
  );
  await tierNFT.waitForDeployment();
  const tierNFTAddress = await tierNFT.getAddress();
  console.log("  ✓ TierNFT:", tierNFTAddress);

  // Update deployments.json
  deployments.tierNFT = tierNFTAddress;
  fs.writeFileSync("deployments.json", JSON.stringify(deployments, null, 2));
  console.log("\n✓ deployments.json updated");

  console.log("\n════════════════════════════════════════");
  console.log("  TierNFT deployed!");
  console.log("  Address:", tierNFTAddress);
  console.log("  Update app/lib/contracts.ts → tierNFT");
  console.log("════════════════════════════════════════\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
