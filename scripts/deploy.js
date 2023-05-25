
//The below codes will execute on deployment.
//first buyer, seller and lender accounts will be created from list of hardhat accounts.
//Next, the 3 NFTs(properties) get minted by the seller.
//After which, he'll list all three NFTS(houses) for sale
//The rest transactions can then be carried out in our frontend.
const hre = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

async function main() {
  //Setting up our accounts
  [buyer, seller, lender, inspector] = await ethers.getSigners();
  //Get the contract
  const RealEstate = await ethers.getContractFactory("RealEstate");
  //deploy the contract
  const realEstate = await RealEstate.deploy();
  //wait for the contract to be deployed
  await realEstate.deployed();
  //confirm the deployment
  console.log(`deployed Real Estate contract at: ${realEstate.address}`)

  console.log(`Minting 3 properties...\n`);

  //handles the minting of the NFTs
  for(let i = 1; i < 4; i++) {
    const transaction = await realEstate.connect(seller).mint(`https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i}.json`);
    await transaction.wait();
  }

  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(realEstate.address, seller.address, inspector.address, lender.address);
  await escrow.deployed();

  console.log(`Deployed Escrow Contract at: ${escrow.address}`);
  console.log("Listing properties...");

  //Hanldes approval to spend the NFTs/properties
  for(let i = 1; i < 4; i++) {
    let transaction = await realEstate.connect(seller).approve(escrow.address, i);
    await transaction.wait();
  }

  //list properties
  transaction = await escrow
    .connect(seller)
    .listProperty(1, tokens(20), tokens(10), buyer.address);
  await transaction.wait()

  transaction = await escrow
    .connect(seller)
    .listProperty(2, tokens(20), tokens(10), buyer.address);
  await transaction.wait()

  transaction = await escrow
    .connect(seller)
    .listProperty(3, tokens(20), tokens(10), buyer.address);
  await transaction.wait()

  console.log("Finished");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


