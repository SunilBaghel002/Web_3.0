import React, { useEffect, useState } from "react";
import { ethers, BrowserProvider } from "ethers";  // UPDATED: Import BrowserProvider directly

import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

const { ethereum } = window;

// UPDATED: Make async for v6 signer
const createEthereumContract = async () => {
  if (!ethereum) throw new Error("Ethereum object not found");
  const provider = new BrowserProvider(ethereum);  // FIXED: v6 BrowserProvider
  const signer = await provider.getSigner();  // FIXED: Await getSigner()
  const transactionsContract = new ethers.Contract(contractAddress, contractABI, signer);
  return transactionsContract;
};

export const TransactionsProvider = ({ children }) => {
  const [formData, setformData] = useState({ addressTo: "", amount: "", keyword: "", message: "" });
  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount"));
  const [transactions, setTransactions] = useState([]);

  const handleChange = (e, name) => {
    setformData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const getAllTransactions = async () => {
    try {
      if (!ethereum) {
        console.log("Ethereum is not present");
        return;
      }
      const transactionsContract = await createEthereumContract();  // UPDATED: Await

      const availableTransactions = await transactionsContract.getAllTransactions();

      // FIXED: v6 BigInt handling with formatEther
      const structuredTransactions = availableTransactions.map((transaction) => ({
        addressTo: transaction.receiver,
        addressFrom: transaction.sender,
        timestamp: new Date(Number(transaction.timestamp) * 1000).toLocaleString(),  // Number() for BigInt
        message: transaction.message,
        keyword: transaction.keyword,
        amount: parseFloat(ethers.formatEther(transaction.amount))  // FIXED: formatEther for ETH display
      }));

      console.log(structuredTransactions);
      setTransactions(structuredTransactions);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnect = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        getAllTransactions();
      } else {
        console.log("No accounts found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // UPDATED: Await contract, better error handling (no misleading throw)
  const checkIfTransactionsExists = async () => {
    try {
      if (!ethereum) return;  // Skip if no ethereum

      const transactionsContract = await createEthereumContract();
      const currentTransactionCount = await transactionsContract.getTransactionCount();

      localStorage.setItem("transactionCount", currentTransactionCount.toString());  // FIXED: toString() for localStorage
      setTransactionCount(currentTransactionCount.toString());
    } catch (error) {
      console.error("Error checking transactions:", error);  // FIXED: Log real error
      // No throw—let it fail gracefully (app continues)
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      setCurrentAccount(accounts[0]);
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) {
        console.log("No ethereum object");
        return;
      }

      const { addressTo, amount, keyword, message } = formData;
      const transactionsContract = await createEthereumContract();  // UPDATED: Await
      const parsedAmount = ethers.parseEther(amount);  // FIXED: v6 parseEther (no .utils)

      // UPDATED: Use contract's payable method directly (sends ETH + logs in one tx)
      const transactionHash = await transactionsContract.addToBlockchain(
        addressTo,
        parsedAmount,
        message,
        keyword,
        { value: parsedAmount }  // FIXED: Send exact amount as value
      );

      setIsLoading(true);
      console.log(`Loading - ${transactionHash.hash}`);
      await transactionHash.wait();
      console.log(`Success - ${transactionHash.hash}`);
      setIsLoading(false);

      const transactionsCount = await transactionsContract.getTransactionCount();
      setTransactionCount(transactionsCount.toString());

      window.location.reload();
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnect();
    checkIfTransactionsExists();
  }, [transactionCount]);

  return (
    <TransactionContext.Provider
      value={{
        transactionCount,
        connectWallet,
        transactions,
        currentAccount,
        isLoading,
        sendTransaction,
        handleChange,
        formData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};