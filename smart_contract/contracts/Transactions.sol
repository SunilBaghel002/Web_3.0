// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "hardhat/console.sol";

contract Transactions {
    event Transfer(address from, address receiver, uint amount, string message, uint256 timestamp, string keyword);

    struct TransferStruct {
        address sender;
        address receiver;
        uint amount;
        string message;
        uint256 timestamp;
        string keyword;
    }

    TransferStruct[] public transactions;  // Made public for easier access

    function addToBlockchain(address payable receiver, uint amount, string memory message, string memory keyword) public payable {
        require(amount > 0, "Amount must be greater than 0");
        require(msg.value == amount, "Sent ETH must match amount");  // Ensures exact wei sent

        receiver.transfer(amount);  // Actually transfer ETH

        transactions.push(TransferStruct(msg.sender, receiver, amount, message, block.timestamp, keyword));
        console.log("Transaction added: %s sent %s wei to %s", message, amount, receiver);

        emit Transfer(msg.sender, receiver, amount, message, block.timestamp, keyword);
    }

    function getAllTransactions() public view returns (TransferStruct[] memory) {
        return transactions;
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    // Bonus: View receiver's contract balance
    function getBalance(address addr) public view returns (uint256) {
        return addr.balance;
    }
}