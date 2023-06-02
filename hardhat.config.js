require("@nomicfoundation/hardhat-toolbox");
//Using localhardhat node by default so no need to configure networks and chains.
//If to be deployed on a regular network(ETH, BSC, POLYGON), please configure network before deployment as done below.
require("dotenv").config({ path: ".env" });
require("@nomiclabs/hardhat-etherscan");

const ALCHEMY_SEPOLIA_API_KEY_URL =
  process.env.ALCHEMY_SEPOLIA_API_KEY_URL || "https://eth-sepolia/example.com";
const ACCOUNT_ONE_PRIVATE_KEY = process.env.ACCOUNT_ONE_PRIVATE_KEY;
const ACCOUNT_TWO_PRIVATE_KEY = process.env.ACCOUNT_TWO_PRIVATE_KEY;
const ACCOUNT_THREE_PRIVATE_KEY = process.env.ACCOUNT_THREE_PRIVATE_KEY;
const ACCOUNT_FOUR_PRIVATE_KEY = process.env.ACCOUNT_FOUR_PRIVATE_KEY;

const ETHER_SCAN_API_KEY = process.env.ETHER_SCAN_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks: {
    sepolia: {
      url: ALCHEMY_SEPOLIA_API_KEY_URL,
      accounts: [ACCOUNT_ONE_PRIVATE_KEY, ACCOUNT_TWO_PRIVATE_KEY, ACCOUNT_THREE_PRIVATE_KEY, ACCOUNT_FOUR_PRIVATE_KEY],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: ETHER_SCAN_API_KEY,
  },
};