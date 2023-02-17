import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Tests", function () {
  async function deployOneYearLockFixture() {
    
    const [owner, otherAccount] = await ethers.getSigners();

    const mintingFactory = await ethers.getContractFactory("Minting");
    const mintingToken = await mintingFactory.connect(owner).deploy(2);

    return { mintingToken, owner, otherAccount };
  }

  describe("Mint", function () {
    it("Safe Mint - Owner", async function () {
      const { mintingToken, owner } = await loadFixture(deployOneYearLockFixture);
      expect(await mintingToken.safeMint(owner.address));
    });

    it("Safe Mint - Other Account", async function () {
        const { mintingToken, otherAccount } = await loadFixture(deployOneYearLockFixture);
        await expect(mintingToken.connect(otherAccount).safeMint(otherAccount.address)).eventually.to.rejectedWith(Error, "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner");
    });

    it("Mint Successfully and Deploy Auction's Contract", async function () {
        const { mintingToken, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);
        expect(mintingToken.safeMint(owner.address));
        
        const nftDutchAuctionFactory = await ethers.getContractFactory("NFTDutchAuction");
        const nftDutchAuctionToken = await nftDutchAuctionFactory.deploy(mintingToken.address, 0, 100, 10, 10);
        
        // console.log(owner.address);
        // console.log(mintingToken.address);
        // const result = await nftDutchAuctionToken.getSellerAddress();
        // console.log(result)

        

        expect(await nftDutchAuctionToken.getSellerAddress()).to.equal(owner.address);
        
        describe("Bid - before approval", function () {
            it("Bid - Seller trying to bid", async function () {
                // const result = await nftDutchAuctionToken.connect(owner).bid({value:200});
                // console.log(result);
                await expect(nftDutchAuctionToken.connect(owner).bid({value:200})).to.be.revertedWith('Seller is not permitted to bid');
            });

            it("Bid - Without approval from Minting Contract", async function () {
                //await expect(nftDutchAuctionToken.connect(otherAccount).bid({value:200})).to.be.revertedWith('This is supposed to fail');
                await expect(nftDutchAuctionToken.connect(otherAccount).bid({value:200})).to.be.revertedWith('ERC721: caller is not token owner or approved');
            });

            it("Approving - Failure due to non-existent token id", async function(){
                await expect(mintingToken.approve(nftDutchAuctionToken.address, 9)).to.be.revertedWith('ERC721: invalid token ID');
            });

            it("Approval - Failure - Not the owner", async function () {
                await expect(mintingToken.connect(otherAccount).approve(nftDutchAuctionToken.address,0)).to.be.revertedWith('ERC721: approve caller is not token owner or approved for all');
            });
            it("Approving", async function () {
                const approvalResult = await mintingToken.approve(nftDutchAuctionToken.address, 0);
                expect(await mintingToken.approve(nftDutchAuctionToken.address,0));
                describe("Bid - After Approval", function () {
                    it("Bid - Failure - Insufficient Funds", async function () {
                        await expect(nftDutchAuctionToken.connect(otherAccount).bid({from: otherAccount.address, value: 100 })).to.be.revertedWith('Insufficient Funds');
                    });

                    it("Bid - Failure - Less than reserve price", async function () {
                        await expect(nftDutchAuctionToken.connect(otherAccount).bid({from: otherAccount.address, value: 1 })).to.be.revertedWith('Place a bid greater than reserve price');;
                    });

                    it("Bid - Success", async function () {
                        await expect(nftDutchAuctionToken.connect(otherAccount).bid({from: otherAccount.address, value: 200 }));
                    });

                    it("Bid - Failure - Closed Auction", async function () {
                       await expect(nftDutchAuctionToken.connect(otherAccount).bid({from: otherAccount.address, value: 210 })).to.be.revertedWith('Auction is closed');;
                    });
                });
                
            });
        });
        
      });

  });
});
