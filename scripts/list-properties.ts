/**
 * List the 4 remaining properties on PropertyRegistry.
 * Pearl Dubai was already listed in the initial deploy.
 * Run: npx hardhat run scripts/list-properties.ts --network arbitrumSepolia
 */

import { ethers } from "hardhat";

const REGISTRY = "0xCdBCA38E4C86bdC74Cd49D93cE2B88D3ecC00d5e";

// pricePerToken = 1 USDT = 1_000_000 (6 decimals)
// monthlyRent   = totalSupply × yield / 12, in USDT 6-decimal
const PROPERTIES = [
  {
    name:         "Shibuya Terrace",
    location:     "Shibuya, Tokyo, Japan",
    ipfsDocHash:  "pending-shibuya-tyo-001",
    totalSupply:  380_000,
    pricePerToken: 1_000_000,
    monthlyRent:  1_869_500,   // 380k × 5.9% / 12 ≈ 1,869.5 USDT
  },
  {
    name:         "Marina Heights",
    location:     "Marina Bay, Singapore",
    ipfsDocHash:  "pending-marina-sgp-001",
    totalSupply:  620_000,
    pricePerToken: 1_000_000,
    monthlyRent:  3_720_000,   // 620k × 7.2% / 12 = 3,720 USDT
  },
  {
    name:         "Canary Wharf Executive",
    location:     "Canary Wharf, London, UK",
    ipfsDocHash:  "pending-canary-lon-001",
    totalSupply:  850_000,
    pricePerToken: 1_000_000,
    monthlyRent:  3_825_000,   // 850k × 5.4% / 12 = 3,825 USDT
  },
  {
    name:         "Azure Barcelona Suite",
    location:     "Eixample, Barcelona, Spain",
    ipfsDocHash:  "pending-azure-bcn-001",
    totalSupply:  290_000,
    pricePerToken: 1_000_000,
    monthlyRent:  1_957_250,   // 290k × 8.1% / 12 ≈ 1,957 USDT
  },
];

const REGISTRY_ABI = [
  "function listProperty(string,string,string,uint256,uint256,uint256) external returns (uint256,address)",
  "event PropertyListed(uint256 indexed propertyId, address indexed tokenContract, string name)",
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const registry = new ethers.Contract(REGISTRY, REGISTRY_ABI, deployer);

  const results: Record<string, string> = {};

  for (const prop of PROPERTIES) {
    console.log(`\nListing: ${prop.name}...`);
    const tx = await registry.listProperty(
      prop.name,
      prop.location,
      prop.ipfsDocHash,
      prop.totalSupply,
      prop.pricePerToken,
      prop.monthlyRent,
    );
    const receipt = await tx.wait();

    let tokenAddress = "";
    const iface = new ethers.Interface(REGISTRY_ABI);
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "PropertyListed") {
          tokenAddress = parsed.args.tokenContract;
        }
      } catch {}
    }

    console.log(`  ✓ ${prop.name}: ${tokenAddress}`);
    results[prop.name] = tokenAddress;
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("  Property Contracts Deployed");
  console.log("═══════════════════════════════════════════");
  for (const [name, addr] of Object.entries(results)) {
    console.log(`  ${name}: ${addr}`);
  }
  console.log("\nUpdate propertiesData.ts with these addresses.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
