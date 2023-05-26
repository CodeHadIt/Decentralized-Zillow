const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let buyer, seller, lender, inspector;
  let realEstate, escrow;

  beforeEach(async () => {
    // Get party accounts
    [buyer, seller, lender, inspector] = await ethers.getSigners();

    // Deploy Real Estate(NFT) contract
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();

    // Mint NFT to seller
    let transaction = await realEstate
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
      );
    await transaction.wait();

    // Deploy Escrow(Main) Contract
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      realEstate.address,
      seller.address,
      lender.address,
      inspector.address
    );

    // Approve the Escrow contract to spend the NFT
    transaction = await realEstate.connect(seller).approve(escrow.address, 1);
    await transaction.wait();

    // List Property
    transaction = await escrow
      .connect(seller)
      .listProperty(1, tokens(10), tokens(5), buyer.address);
    await transaction.wait();
  });

  describe("Handles Deployment", () => {
    it("Returns the RE NFT address", async () => {
      const result = await escrow.nftAddress();
      expect(result).to.be.equal(realEstate.address);
    });

    it("Returns seller", async () => {
      const result = await escrow.seller();
      expect(result).to.be.equal(seller.address);
    });

    it("Returns lender", async () => {
      const result = await escrow.lender();
      expect(result).to.be.equal(lender.address);
    });

    it("Returns inspector", async () => {
        const result = await escrow.inspector();
        expect(result).to.be.equal(inspector.address);
    });
  });

  describe("Handles Listing", () => {
    it("Updates isListed", async () => {
      const result = await escrow.isListed(1);
      expect(result).to.be.equal(true);
    });

    it("Returns buyer", async () => {
      const result = await escrow.buyer(1);
      expect(result).to.be.equal(buyer.address);
    });

    it("Returns purchase price", async () => {
      const result = await escrow.purchasePrice(1);
      expect(result).to.be.equal(tokens(10));
    });

    it("Returns escrow amount", async () => {
      const result = await escrow.escrowAmount(1);
      expect(result).to.be.equal(tokens(5));
    });

    it("Updates ownership to escrow address", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address);
    });
  });

  describe("Handles Deposits", () => {
    beforeEach(async () => {
      const transaction = await escrow
        .connect(buyer)
        .depositFunds(1, { value: tokens(5) });
      await transaction.wait();
    });

    it("Updates escrow contract balance", async () => {
      const result = await escrow.getBalance();
      expect(result).to.be.equal(tokens(5));
    });
  });

  describe("Inspection", () => {
    beforeEach(async () => {
      const transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await transaction.wait();
    });

    it("Updates inspection status", async () => {
      const result = await escrow.inspectionPassed(1);
      expect(result).to.be.equal(true);
    });
  });

  describe("Approval", () => {
    beforeEach(async () => {
      let transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(lender).approveSale(1);
      await transaction.wait();
    });

    it("Updates approval status", async () => {
      expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
      expect(await escrow.approval(1, seller.address)).to.be.equal(true);
      expect(await escrow.approval(1, lender.address)).to.be.equal(true);
    });
  });

  describe("Handles Sale", () => {
    beforeEach(async () => {
      let transaction = await escrow
        .connect(buyer)
        .depositFunds(1, { value: tokens(5) });
      await transaction.wait();

      transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await transaction.wait();

      transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(lender).approveSale(1);
      await transaction.wait();

      await lender.sendTransaction({ to: escrow.address, value: tokens(5) });

      transaction = await escrow.connect(seller).finalizeSale(1);
      await transaction.wait();
    });

    it("Updates ownership of NFT after sale", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address);
    });

    it("Updates balance", async () => {
      expect(await escrow.getBalance()).to.be.equal(0);
    });
  });

  describe("Handles Cancellation", () => {
    beforeEach(async () => {
      let transaction = await escrow
        .connect(buyer)
        .depositFunds(1, { value: tokens(5) });
      await transaction.wait();
    });
    it("Fails when anyone but buyer and seller tries to cancel", async () => {
      await expect(escrow.connect(lender).cancelSale(1)).to.be.revertedWith(
        "Only buyer or seller can call"
      );
    });
    it("Fails because inspection has already passed", async () => {
      let transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await transaction.wait();
      await expect(escrow.connect(buyer).cancelSale(1)).to.be.revertedWith(
        "Inspection already passed"
      );
    });
    it("Goes Successfully", async () => {
      let transaction = await escrow.connect(buyer).cancelSale(1);
      await transaction.wait();

      let result = await escrow.getBalance();
      expect(result).to.be.equal(tokens(0));
    })
  })
});
