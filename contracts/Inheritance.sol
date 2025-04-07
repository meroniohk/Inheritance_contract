// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/automation/KeeperCompatible.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract Inheritance is KeeperCompatibleInterface, ReentrancyGuardUpgradeable {
    address public owner;
    address public heir;
    uint256 public lastWithdrawalTime;
    uint256 public constant TIME_LIMIT = 30 days;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyHeir() {
        require(msg.sender == heir, "Not heir");
        _;
    }

    modifier resetTimer() {
        lastWithdrawalTime = block.timestamp;
        _;
    }

    constructor(address _heir) {
        require(_heir != address(0), "Invalid heir");
        owner = msg.sender;
        heir = _heir;
        lastWithdrawalTime = block.timestamp;
    }

    function withdraw(uint256 amount) external onlyOwner nonReentrant resetTimer {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(amount);
        emit WithdrawETH(owner, amount);
    }

    function takeOver() external onlyHeir {
        require(block.timestamp > lastWithdrawalTime + TIME_LIMIT, "Owner still active");
        _transferOwnership();
    }

    function setNewHeir(address _newHeir) external onlyOwner {
        require(_newHeir != address(0), "Invalid heir");
        heir = _newHeir;
        emit SetHeir(_newHeir);
    }

    // Chainlink Keeper: Check if 30 days have passed
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory) {
        upkeepNeeded = block.timestamp > lastWithdrawalTime + TIME_LIMIT;
        return (upkeepNeeded, "");
    }

    // Chainlink Keeper: Transfer ownership to heir
    function performUpkeep(bytes calldata) external override {
        require(block.timestamp > lastWithdrawalTime + TIME_LIMIT, "Owner still active");
        _transferOwnership();
    }

    function _transferOwnership() private {
        address oldOwner = owner;
        owner = heir;
        lastWithdrawalTime = block.timestamp;
        emit TransferOwner(oldOwner, heir);
    }

    receive() external payable {}

    event TransferOwner(address indexed previousOwner, address indexed newOwner);
    event SetHeir(address indexed newHeir);
    event WithdrawETH(address indexed owner, uint256 amount);
}