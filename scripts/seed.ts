import { ethers } from "hardhat";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Seed script — populates the deployed ChainEstate platform with demo data:
 *   1. Reads deployed contract addresses from deployments.json
 *   2. Mints test USDT to three wallets (if using a mock USDT)
 *   3. Three wallets purchase property tokens
 *   4. Admin deposits rent
 *   5. Admin triggers rent distribution
 *
 * Run after deploy.ts:
 *   npx hardhat run scripts/seed.ts --network hardhat
 */
async function main() {
  if (!fs.existsSync("deployments.json")) {
    throw new Error("deployments.json not found — run deploy.ts first");
  }

  const deployments = JSON.parse(fs.readFileSync("deployments.json", "utf8"));
  const signers = await ethers.getSigners();
  const [admin, walletA, walletB, walletC] = signers;

  const registryAddress = deployments.registry;
  const rentDistributorAddress = deployments.rentDistributor;
  const demoTokenAddress = deployments.demoPropertyToken;
  const usdtAddress = deployments.usdt;

  console.log("ChainEstate Seed Script");
  console.log("Registry:          ", registryAddress);
  console.log("RentDistributor:   ", rentDistributorAddress);
  console.log("Demo PropertyToken:", demoTokenAddress, "\n");

  const registry = await ethers.getContractAt("PropertyRegistry", registryAddress);
  const rentDistributor = await ethers.getContractAt("RentDistributor", rentDistributorAddress);
  const usdt = await ethers.getContractAt("IERC20", usdtAddress);

  // ─── Step 1: Approve USDT for purchases ──────────────────────────────────
  const ONE_MILLION_USDT = ethers.parseUnits("1000000", 6);

  console.log("1. Approving USDT for investors...");
  for (const wallet of [walletA, walletB, walletC]) {
    const tx = await usdt.connect(wallet).approve(demoTokenAddress, ONE_MILLION_USDT);
    await tx.wait();
  }
  console.log("  ✓ USDT approved for all wallets\n");

  // ─── Step 2: Purchase tokens ──────────────────────────────────────────────
  // NOTE: In production, handle and handleProof come from the iExec Nox JS SDK.
  // For seed/demo purposes on a local fork, we use placeholder values.
  // The TEE will process these asynchronously.
  const PLACEHOLDER_HANDLE = {
    data: ethers.ZeroHash,
    securityZone: 0,
  };
  const PLACEHOLDER_PROOF = ethers.toUtf8Bytes("seed-demo-proof");

  const propertyToken = await ethers.getContractAt("PropertyToken", demoTokenAddress);

  console.log("2. Purchasing tokens...");
  const purchases = [
    { wallet: walletA, amount: 1000, label: "Wallet A" },
    { wallet: walletB, amount: 500,  label: "Wallet B" },
    { wallet: walletC, amount: 250,  label: "Wallet C" },
  ];

  for (const { wallet, amount, label } of purchases) {
    const tx = await propertyToken.connect(wallet).purchaseTokens(
      PLACEHOLDER_HANDLE,
      PLACEHOLDER_PROOF,
      amount
    );
    await tx.wait();
    console.log(`  ✓ ${label} purchased ${amount} tokens`);
  }
  console.log();

  // ─── Step 3: Deposit rent ─────────────────────────────────────────────────
  const RENT_AMOUNT = ethers.parseUnits("3000", 6); // 3,000 USDT
  console.log("3. Depositing rent (3,000 USDT)...");
  await (await usdt.connect(admin).approve(rentDistributorAddress, RENT_AMOUNT)).wait();
  const depositTx = await rentDistributor.connect(admin).depositRent(1, RENT_AMOUNT);
  await depositTx.wait();
  console.log("  ✓ Rent deposited\n");

  // ─── Step 4: Distribute rent ──────────────────────────────────────────────
  console.log("4. Distributing rent to all holders...");
  const distributeTx = await rentDistributor.connect(admin).distributeRent(1);
  await distributeTx.wait();
  console.log("  ✓ Rent distributed");
  console.log("    All events on-chain but individual amounts are encrypted\n");

  // ─── Summary ─────────────────────────────────────────────────────────────
  const holders = await registry.getPropertyHolders(1);
  const history = await rentDistributor.getDistributionHistory(1);

  console.log("═══════════════════════════════════════════════════");
  console.log("  Seed Complete");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Registered holders: ${holders.length}`);
  console.log(`  Distributions recorded: ${history.length}`);
  if (history.length > 0) {
    const last = history[history.length - 1];
    console.log(`  Last distribution:`);
    console.log(`    Total:          ${ethers.formatUnits(last.amount, 6)} USDT`);
    console.log(`    Platform fee:   ${ethers.formatUnits(last.platformFee, 6)} USDT`);
    console.log(`    Maintenance:    ${ethers.formatUnits(last.maintenanceFee, 6)} USDT`);
    console.log(`    Net to holders: ${ethers.formatUnits(last.netAmount, 6)} USDT`);
    console.log(`    Recipients:     ${last.recipientCount}`);
  }
  console.log("═══════════════════════════════════════════════════");
  console.log("  Demo complete. Check dashboard.chainestate.io");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
