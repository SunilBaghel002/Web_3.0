const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Transactions", function () {
  let transactions, owner, addr1, addr2;
  const AMOUNT = ethers.parseEther("0.01");  // 0.01 ETH in wei
  const MESSAGE = "Hello from test!";
  const KEYWORD = "test-tx";

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    Transactions = await ethers.getContractFactory("Transactions");
    transactions = await Transactions.deploy();
    await transactions.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy the contract", async function () {
      expect(await transactions.getAddress()).to.not.be.undefined;
    });

    it("Should start with zero transactions", async function () {
      expect(await transactions.getTransactionCount()).to.equal(0);
    });
  });

  describe("Adding Transactions", function () {
    it("Should add a transaction and emit event", async function () {
      // Fund addr1 for transfer
      await owner.sendTransaction({ to: addr1.address, value: AMOUNT });

      // From addr1 to addr2
      await expect(
        transactions.connect(addr1).addToBlockchain(
          addr2.address,
          AMOUNT,
          MESSAGE,
          KEYWORD,
          { value: AMOUNT }  // Send ETH with tx
        )
      )
        .to.emit(transactions, "Transfer")
        .withArgs(addr1.address, addr2.address, AMOUNT, MESSAGE, await time.latest(), KEYWORD);  // time.latest() for timestamp approx

      // Check count
      expect(await transactions.getTransactionCount()).to.equal(1);

      // Check balance increased
      expect(await ethers.provider.getBalance(addr2.address)).to.equal(AMOUNT);
    });

    it("Should revert if amount is zero", async function () {
      await expect(
        transactions.addToBlockchain(addr1.address, 0, MESSAGE, KEYWORD, { value: 0 })
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should revert if msg.value != amount", async function () {
      await expect(
        transactions.addToBlockchain(addr1.address, AMOUNT, MESSAGE, KEYWORD, { value: 0 })
      ).to.be.revertedWith("Sent ETH must match amount");
    });
  });

  describe("Reading Transactions", function () {
    beforeEach(async function () {
      // Add one tx first
      await owner.sendTransaction({ to: addr1.address, value: AMOUNT });
      await transactions.connect(addr1).addToBlockchain(
        addr2.address,
        AMOUNT,
        MESSAGE,
        KEYWORD,
        { value: AMOUNT }
      );
    });

    it("Should return all transactions", async function () {
      const txs = await transactions.getAllTransactions();
      expect(txs.length).to.equal(1);
      expect(txs[0].sender).to.equal(addr1.address);
      expect(txs[0].message).to.equal(MESSAGE);
    });

    it("Should return correct count", async function () {
      expect(await transactions.getTransactionCount()).to.equal(1);
    });

    it("Should return correct balance", async function () {
      expect(await transactions.getBalance(addr2.address)).to.equal(AMOUNT);
    });
  });
});