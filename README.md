# Inheritance Contract
## Overview 
inheritance is a smart contract writen in  solidity. It allows owners to transfer and withdaw ETH from the contract including 0 ETH.If the user does withdraw ETH with in 30 days an heir can take control of the contract and can designate a new heir. The contract uses Chainlin keepers to check if the owner is inactive ans OpenZeppelin for security features.

## Setup
1. Clone the repo: `git clone<repo>`
2. install dependency
` npm install --save-dev @nomicfoundation/hardhat-network-helpers @nomicfoundation/hardhat-verify solidity-coverage
npm install @openzeppelin/contracts-upgradeable @chainlink/contracts `
3. Config .env: Add SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, HEIRADDRESS, ETHERSCAN_API_KEY

## Deploy Contract
1. To compile the contracts 
`npx hardhat compile`
2. Test 
`npx hardhat test
npx hardhat coverage`
3. Deploy on test 
`npx hardhat run scripts/deploy.js --network sepolia`
4. To interact with the contract deployed on testnet using hardhat console
`npx hardhat console --network sepolia`

## Register UpKeep on Chainlink automation
1. Connect wallet with chainlink automation 
2. Register New Upkeep with `custom logic`, enter the smart contract address, starting balance(5 LINK), and provide a name
