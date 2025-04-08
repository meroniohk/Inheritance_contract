const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const Inheritance = await ethers.getContractFactory("Inheritance");
  const heirAddress = process.env.HEIRADDRESS;
  const inheritance = await Inheritance.deploy(heirAddress);

  console.log("Contract deployed to:", await inheritance.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});