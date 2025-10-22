require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,  // Paste here
      accounts: [process.env.PRIVATE_KEY]  // Export from MetaMask (Account Details > Export Private Key—do this ONCE, securely!)
    }
  }
};