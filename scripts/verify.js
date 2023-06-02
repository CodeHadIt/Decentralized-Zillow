const { run } = require("hardhat");

const verify = async (address, args) => {
  console.log(`Now verifying on EtherScan .....`);
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: args,
    });
  } catch (error) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("already Verified");
    } else {
      console.log(error);
    }
  }
};

module.exports = {
  verify,
};
