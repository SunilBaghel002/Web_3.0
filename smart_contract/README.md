# Web3 dApp Setup Guide

This guide walks you through setting up a basic Web3 development environment using **Hardhat** for smart contracts and **Vite + React** for the frontend. We'll deploy to the Sepolia testnet (Ethereum's free testing network) and integrate with MetaMask. 

**Estimated Time**: 30-60 minutes for first-time setup.  
**Requirements**: Basic terminal knowledge (e.g., Command Prompt on Windows, Terminal on macOS/Linux).

## Prerequisites

Before starting, ensure you have:
- **Node.js** (v18+ LTS recommended): Download from [nodejs.org](https://nodejs.org). Verify: `node --version`.
- **MetaMask Wallet**: Install the browser extension from [metamask.io](https://metamask.io). Create a wallet and switch to the **Sepolia testnet** (add via Settings > Networks).
- **Alchemy Account**: Sign up for free at [alchemy.com](https://www.alchemy.com). Create a new app (Ethereum > Sepolia) and copy your **HTTPS RPC URL** (e.g., `https://eth-sepolia.g.alchemy.com/v2/abc123...`).
- **Test ETH**: Get free Sepolia ETH from faucets like [faucets.chain.link/sepolia](https://faucets.chain.link/sepolia) (connect MetaMask, no mainnet balance needed).
- **VS Code** (optional but recommended): Install from [code.visualstudio.com](https://code.visualstudio.com) with extensions like "Solidity" and "ES7+ React/Redux/React Native snippets".

**Security Note**: Never commit sensitive info (e.g., private keys) to Git. Use `.env` files (see below).

## Project Structure

We'll create a monorepo with:
- `contracts/`, `scripts/`, `test/`: Hardhat backend.
- `frontend/`: React app.

Run all commands in your terminal.

## Step 1: Initialize the Project

1. Create and navigate to your project folder:
   ```bash
   mkdir my-web3-dapp && cd my-web3-dapp
   ```

2. Initialize npm and install Hardhat:
   ```bash
   npm init -y
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   ```

3. Set up Hardhat (select **JavaScript project** when prompted):
   ```bash
   npx hardhat init
   ```
   - Accept defaults for other prompts.
   - This creates `contracts/`, `scripts/`, `test/`, and `hardhat.config.js`.

4. Create the frontend folder and install dependencies:
   ```bash
   mkdir frontend && cd frontend
   npm create vite@latest . -- --template react
   npm install
   npm install ethers@^6.13.1 wagmi@^2.10.0 viem@^2.21.26 @tanstack/react-query
   cd ..
   ```
   - This sets up a Vite + React app in `frontend/`.

## Step 2: Configure Hardhat

1. Install dotenv for secure env vars:
   ```bash
   npm install dotenv --save-dev
   ```

2. Create `.env` in the root (never commit this—add to `.gitignore`):
   ```
   ALCHEMY_API_KEY=your_alchemy_https_rpc_url_here  # Full URL from Alchemy
   PRIVATE_KEY=your_metamask_private_key_here  # Export once from MetaMask > Account Details > Export Private Key
   ```

3. Update `hardhat.config.js`:
   ```javascript
   require("@nomicfoundation/hardhat-toolbox");
   require("dotenv").config();

   module.exports = {
     solidity: "0.8.24",
     networks: {
       hardhat: {},  // Local testing
       sepolia: {
         url: process.env.ALCHEMY_API_KEY,
         accounts: [process.env.PRIVATE_KEY]
       }
     }
   };
   ```

## Step 3: Develop the Smart Contract

1. In `contracts/`, create `YourContract.sol` (e.g., replace the sample `Lock.sol`):
   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.24;

   contract YourContract {
       // Your contract logic here
   }
   ```

2. Compile:
   ```bash
   npx hardhat compile
   ```

3. (Optional) Write tests in `test/YourContract.test.js` and run:
   ```bash
   npx hardhat test
   ```

## Step 4: Deploy the Contract

1. Create/update `scripts/deploy.js`:
   ```javascript
   const hre = require("hardhat");

   async function main() {
     const Contract = await hre.ethers.getContractFactory("YourContract");
     const contract = await Contract.deploy(/* constructor args if any */);

     await contract.waitForDeployment();
     console.log("Deployed to:", await contract.getAddress());
   }

   main().catch((error) => {
     console.error(error);
     process.exitCode = 1;
   });
   ```

2. Deploy to Sepolia:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```
   - Copy the output address (e.g., `0x123...abc`).
   - Verify on [sepolia.etherscan.io](https://sepolia.etherscan.io) (search the address).

## Step 5: Set Up the Frontend

1. In `frontend/src/`, update `main.jsx` for Wagmi (wallet integration):
   ```jsx
   import React from 'react';
   import ReactDOM from 'react-dom/client';
   import App from './App.jsx';
   import './index.css';
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   import { WagmiProvider, createConfig, http } from 'wagmi';
   import { sepolia } from 'wagmi/chains';
   import { injected } from 'wagmi/connectors';

   const queryClient = new QueryClient();
   const config = createConfig({
     chains: [sepolia],
     connectors: [injected()],
     transports: { [sepolia.id]: http('YOUR_ALCHEMY_API_KEY') }  // Use your Alchemy URL
   });

   ReactDOM.createRoot(document.getElementById('root')).render(
     <React.StrictMode>
       <WagmiProvider config={config}>
         <QueryClientProvider client={queryClient}>
           <App />
         </QueryClientProvider>
       </WagmiProvider>
     </React.StrictMode>,
   );
   ```

2. In `frontend/src/App.jsx`, integrate Ethers/Wagmi (example for reading a value):
   ```jsx
   import { useAccount, useReadContract } from 'wagmi';
   import { useContractAddress } from './hooks';  // Custom hook for address

   function App() {
     const { address, isConnected } = useAccount();
     const contractAddress = useContractAddress();  // Paste deployed address here

     const { data: value } = useReadContract({
       address: contractAddress,
       abi: [/* Paste your contract ABI here */],
       functionName: 'yourViewFunction'
     });

     if (!isConnected) return <button>Connect Wallet</button>;

     return (
       <div>
         <p>Connected: {address}</p>
         <p>Value: {value?.toString()}</p>
       </div>
     );
   }

   export default App;
   ```

3. Create `frontend/src/hooks.js`:
   ```javascript
   import { useMemo } from 'react';

   export function useContractAddress() {
     return useMemo(() => 'YOUR_DEPLOYED_CONTRACT_ADDRESS', []);
   }
   ```

4. Run the dev server:
   ```bash
   cd frontend
   npm run dev
   ```
   - Open `http://localhost:5173`. Connect MetaMask and test interactions.

## Step 6: Deploy Frontend (Optional: Vercel)

1. Push to GitHub.
2. Connect repo to [vercel.com](https://vercel.com) → Import → Deploy.
3. Update contract address in code → Redeploy.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid network" in MetaMask | Switch to Sepolia in MetaMask settings. |
| "Insufficient funds" | Request more test ETH from faucets. |
| "Compilation failed" | Check Solidity syntax; run `npx hardhat clean && npx hardhat compile`. |
| Frontend "No ethereum object" | Ensure MetaMask is installed/injected; use Ethers v6 syntax (BrowserProvider). |
| Private key exposed | Regenerate in MetaMask; use `.env` only. |

## Security & Best Practices

- **Keys**: Store in `.env`; add `.env` to `.gitignore`.
- **Audits**: For production, audit contracts with tools like Slither.
- **Gas Optimization**: Use Remix IDE for quick tests.
- **Resources**: [Hardhat Docs](https://hardhat.org), [Wagmi Docs](https://wagmi.sh), [Ethereum Book](https://ethereum.org/en/developers/docs/).

Fork this repo, star it, and contribute! Questions? Open an issue. 🚀