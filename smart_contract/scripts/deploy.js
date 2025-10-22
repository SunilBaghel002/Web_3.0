const hre = require("hardhat");

async function main() {
  const Transactions = await hre.ethers.getContractFactory("Transactions");
  const transactions = await Transactions.deploy();

  await transactions.waitForDeployment();

  console.log("Transactions deployed to:", await transactions.getAddress());
  console.log("On network:", hre.network.name);  // e.g., 'hardhat' or 'sepolia'
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});