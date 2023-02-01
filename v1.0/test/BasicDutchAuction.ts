import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Lock", function () {
  async function deployOneYearLockFixture() {
    
    const [owner, otherAccount] = await ethers.getSigners();

    const basicDutchAuctionFactory = await ethers.getContractFactory("BasicDutchAuction");
    const basicDutchAuctionToken = await basicDutchAuctionFactory.connect(owner).deploy(100, 10, 10);

    return { basicDutchAuctionToken, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Get Price", async function () {
      const { basicDutchAuctionToken, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);

      expect(await basicDutchAuctionToken.getPrice()).to.equal(200);
    });

    it("Bid from owner account", async function () {
      const { basicDutchAuctionToken, owner } = await loadFixture(deployOneYearLockFixture);

      expect(basicDutchAuctionToken.connect(owner).bid({value:200})).to.be.revertedWith('Seller is not permitted to bid');
    });

    it("Bid from another account - Equal to the price", async function () {
      const { basicDutchAuctionToken, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);

      expect(await basicDutchAuctionToken.connect(otherAccount).bid({from: otherAccount.address, value: 200 }));
    });

    it("Bid from another account - Greater than the price", async function () {
      const { basicDutchAuctionToken, otherAccount } = await loadFixture(deployOneYearLockFixture);

      expect(await basicDutchAuctionToken.connect(otherAccount).bid({from: otherAccount.address, value: 400 }));
    });

    it("Bid from another account - Less than the price", async function () {
      const { basicDutchAuctionToken, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);

      expect(basicDutchAuctionToken.connect(otherAccount).bid({from: otherAccount.address, value: 20 })).to.be.revertedWith('Insufficient Funds');
    });


    // it("Transfer the Amount", async function () {
    //   const { basicDutchAuctionToken, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);

    //   await basicDutchAuctionToken.transfer(otherAccount.address, 1000);
      
    //   expect(await basicDutchAuctionToken.balances(owner.address)).to.equal(4000);

    //   expect(await basicDutchAuctionToken.balances(otherAccount.address)).to.equal(1000);
    // });

  });
});
