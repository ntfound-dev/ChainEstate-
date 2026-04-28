import { run } from "hardhat";
import * as fs from "fs";

async function main() {
  if (!fs.existsSync("deployments.json")) {
    throw new Error("deployments.json not found — run deploy.ts first");
  }

  const deployments = JSON.parse(fs.readFileSync("deployments.json", "utf8"));
  const {
    cestToken,
    registry,
    rentDistributor,
    secondaryMarket,
    usdt,
    treasury,
  } = deployments;

  const deployer = process.env.ADMIN_ADDRESS || "";

  console.log("Verifying contracts on Arbiscan Sepolia...\n");

  await verify(cestToken, "contracts/tokens/CESTToken.sol:CESTToken", [
    deployer, deployer, deployer, deployer, deployer,
  ]);

  await verify(registry, "contracts/core/PropertyRegistry.sol:PropertyRegistry", [usdt]);

  await verify(rentDistributor, "contracts/core/RentDistributor.sol:RentDistributor", [
    registry, usdt, treasury,
  ]);

  await verify(secondaryMarket, "contracts/market/SecondaryMarket.sol:SecondaryMarket", [
    cestToken, usdt, treasury, registry,
  ]);

  console.log("\nAll contracts verified.");
}

async function verify(address: string, contract: string, args: unknown[]) {
  try {
    console.log(`Verifying ${contract} at ${address}...`);
    await run("verify:verify", {
      address,
      contract,
      constructorArguments: args,
    });
    console.log(`  ✓ Verified`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Already Verified")) {
      console.log(`  ✓ Already verified`);
    } else {
      console.error(`  ✗ Error: ${msg}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
