require("@nomicfoundation/hardhat-toolbox");
//Using localhardhat node by default so no need to configure networks and chains.
//If to be deployed on a regular network(ETH, BSC, POLYGON), please configure network before deployment.

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
};
