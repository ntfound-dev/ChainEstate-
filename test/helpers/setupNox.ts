import { ethers } from "hardhat";

// NoxCompute is expected at this address on local Hardhat (chainId 31337)
const NOX_COMPUTE_ADDRESS = "0x44C00793aD4975617b3B5Fc27D4FB78E772c8236";

/**
 * Deploy MockNoxCompute at the canonical local NoxCompute address.
 * Must be called before any contract that uses iExec Nox operations.
 */
export async function setupMockNox(): Promise<void> {
  const MockNoxCompute = await ethers.getContractFactory("MockNoxCompute");
  const mock = await MockNoxCompute.deploy();
  await mock.waitForDeployment();
  const mockAddress = await mock.getAddress();
  const bytecode = await ethers.provider.getCode(mockAddress);

  // Plant the mock bytecode at the canonical NoxCompute address
  await ethers.provider.send("hardhat_setCode", [NOX_COMPUTE_ADDRESS, bytecode]);
}
