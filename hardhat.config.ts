import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

// Force ts-node to use the Hardhat-specific CommonJS tsconfig
// so tests can use `import { ethers } from "hardhat"` correctly
process.env.TS_NODE_PROJECT = "tsconfig.hardhat.json";

const ARBITRUM_SEPOLIA_RPC = process.env.ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc";
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY || "";

// Use env key only if it looks like a real 32-byte hex key; otherwise fall back
// to Hardhat's well-known default account so local tests/compile always work.
const RAW_KEY = process.env.PRIVATE_KEY || "";
const PRIVATE_KEY =
  RAW_KEY.replace(/^0x/, "").length === 64
    ? RAW_KEY
    : "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      hardfork: "cancun",
    },
    arbitrumSepolia: {
      url: ARBITRUM_SEPOLIA_RPC,
      chainId: 421614,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: ARBISCAN_API_KEY,
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
