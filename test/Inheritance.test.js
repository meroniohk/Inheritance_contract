const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Inheritance Contract", function () {
  let Inheritance, inheritance, owner, heir, otherAccount;
  const thirtyDays = 31 * 24 * 60 * 60;
  before(async function () {
    [owner, heir, otherAccount] = await ethers.getSigners();
    Inheritance = await ethers.getContractFactory("Inheritance");
    inheritance = await Inheritance.deploy(heir.address);
    await inheritance.waitForDeployment();
  });

  beforeEach(async function () {
    inheritance = await Inheritance.deploy(heir.address);
    await inheritance.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set owner and heir correctly", async function () {
      expect(await inheritance.owner()).to.equal(owner.address);
      expect(await inheritance.heir()).to.equal(heir.address);
    });
    it("Should reject zero address heir", async function () {
      await expect(Inheritance.deploy(ethers.ZeroAddress)).to.be.revertedWith("Invalid heir");
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await owner.sendTransaction({to: inheritance.target,value: ethers.parseEther("1.0"),});
    });

    it("Should allow owner to withdraw ETH", async function () {
      const eth = ethers.parseEther("1.0");
      const initialBalance = await ethers.provider.getBalance(owner.address);
      const tx = await inheritance.connect(owner).withdraw(eth);
      await expect(tx).to.emit(inheritance, "WithdrawETH").withArgs(owner.address, eth);
      const receipt = await tx.wait();
      const gasPrice = (await ethers.provider.getFeeData()).gasPrice;
      const gasCost = receipt.gasUsed * gasPrice;
      const balance = await ethers.provider.getBalance(owner.address);
      expect(balance).to.be.closeTo(initialBalance + eth - gasCost, ethers.parseEther("0.01"));
    });

    it("Should fail for non-owner withdrawal", async function () {
      await expect(inheritance.connect(otherAccount).withdraw(0)).to.be.revertedWith("Not owner");
    });

    it("Should only withdraw less than balance", async function () {
      await inheritance.connect(owner).withdraw(ethers.parseEther("1.0"));
      await expect(inheritance.connect(owner).withdraw(ethers.parseEther("1.0"))).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Transfer Ownership", function () {
    it("Should allow heir to take over after inactivity", async function () {
      await time.increase(thirtyDays);
      const tx = await inheritance.connect(heir).takeOver();
      await expect(tx).to.emit(inheritance, "TransferOwner").withArgs(owner.address, heir.address);
      expect(await inheritance.owner()).to.equal(heir.address);
    });

    it("Should fail for takeover before 30day inactive", async function () {
      await expect(inheritance.connect(heir).takeOver()).to.be.revertedWith("Owner still active");
    });

    it("Should only allow heirs to takeover", async function () {
      await time.increase(thirtyDays);
      await expect(inheritance.connect(otherAccount).takeOver()).to.be.revertedWith("Not heir");
    });

    it("Should reset lastWithdrawalTime after takeover", async function () {
      await time.increase(thirtyDays);
      const takeoverTime = await time.latest();
      await inheritance.connect(heir).takeOver();
      expect(await inheritance.lastWithdrawalTime()).to.be.closeTo(takeoverTime, 1);
    });
  });

  describe("Set new Heir", function () {
    it("Should allow owner to set new heir", async function () {
      await expect(inheritance.connect(owner).setNewHeir(otherAccount.address))
        .to.emit(inheritance, "SetHeir")
        .withArgs(otherAccount.address);
      expect(await inheritance.heir()).to.equal(otherAccount.address);
    });

    it("Should fail for heir with zero address", async function () {
      await expect(inheritance.connect(owner).setNewHeir(ethers.ZeroAddress)).to.be.revertedWith("Invalid heir");
    });

    it("Should fail to setNewHeir for non-owners", async function () {
      await expect(inheritance.connect(heir).setNewHeir(otherAccount.address)).to.be.revertedWith("Not owner");
    });
  });

  describe("Chainlink Keeper Integration", function () {
    it("Should handle checkUpkeep correctly", async function () {
      const [upkeepNeededBefore] = await inheritance.checkUpkeep("0x");
      expect(upkeepNeededBefore).to.be.false;
      await time.increase(thirtyDays);
      const [upkeepNeededAfter] = await inheritance.checkUpkeep("0x");
      expect(upkeepNeededAfter).to.be.true;
    });

    it("Should perform upkeep after inactivity", async function () {
      await time.increase(thirtyDays);
      await inheritance.performUpkeep("0x");
      expect(await inheritance.owner()).to.equal(heir.address);
    });

    it("Should fail upkeep before 30 inactive", async function () {
      await expect(inheritance.performUpkeep("0x")).to.be.revertedWith("Owner still active");
    });
  });

  describe("Receive ETH", function () {
    it("Should accept ETH deposits", async function () {
      await owner.sendTransaction({
        to: inheritance.target,
        value: ethers.parseEther("1.0"),
      });
      expect(await ethers.provider.getBalance(inheritance.target)).to.equal(ethers.parseEther("1.0"));
    });
  });
});