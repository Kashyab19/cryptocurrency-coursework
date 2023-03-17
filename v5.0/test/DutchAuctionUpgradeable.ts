import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { BigNumber, constants} from 'ethers'
import {MintingERC20Tokens} from "../typechain-types";


async function getPermitSignature(
                                signer:any, 
                                token:MintingERC20Tokens, 
                                spender:string, 
                                value:any, 
                                deadline:BigNumber) {
    const [nonce, name, version, chainId] = await Promise.all([
        token.nonces(signer.address),
        token.name(),
        "1",
        signer.getChainId(),
    ])

    console.log(token.address)
    return ethers.utils.splitSignature(
        await signer._signTypedData(
            {
                name,
                version,
                chainId,
                verifyingContract: token.address,
            },
            {
                Permit: [
                    {
                        name: "owner",
                        type: "address",
                    },
                    {
                        name: "spender",
                        type: "address",
                    },
                    {
                        name: "value",
                        type: "uint256",
                    },
                    {
                        name: "nonce",
                        type: "uint256",
                    },
                    {
                        name: "deadline",
                        type: "uint256",
                    },
                ],
            },
            {
                owner: signer.address,
                spender,
                value,
                nonce,
                deadline,
            }
        )
    )
}

describe("Tests", function () {
  async function deployOneYearLockFixture() {
    
    const [owner, otherAccount] = await ethers.getSigners();

    const mintingFactoryForERC20 = await ethers.getContractFactory("MintingERC20Tokens");
    const mintingTokenForERC20 = await mintingFactoryForERC20.connect(owner).deploy(1500);
    
    const mintingFactory = await ethers.getContractFactory("Minting_ERC721Tokens");
    const mintingToken = await mintingFactory.connect(owner).deploy(2);

    return { mintingTokenForERC20, mintingToken, owner, otherAccount };
  }

  describe("Mint", function () {
    it("ERC20 Tests - Max Supply Assertion", async function(){
        const {mintingTokenForERC20, owner, otherAccount} = await loadFixture(deployOneYearLockFixture);
        const maxSupply = await mintingTokenForERC20.getMaxSupply();

        describe("ERC20 and ERC721 Tests", function(){
            it("ERC20 by Owner", async function () {
                expect(await mintingTokenForERC20.connect(owner).mint(owner.address, 1000));

                // const balanceOf = await mintingTokenForERC20.balanceOf(owner.address);
                // console.log(balanceOf);
              });
            
            it("ERC20 by Other Account", async function () {
            expect(await mintingTokenForERC20.mint(otherAccount.address, 500));

            // const balanceOf = await mintingTokenForERC20.balanceOf(otherAccount.address);
            // console.log(balanceOf);
            });

            it("ERC20 - Max Supply exceeded", async function () {
                await expect(mintingTokenForERC20.mint(otherAccount.address, 1000)).to.be.revertedWith('Max Supply has reached');
                // const circulatingSupply = await mintingTokenForERC20.totalSupply();
                // console.log(circulatingSupply);
            });

            describe("Auction Tests", function(){
                it("ERC721 - Safe Mint - Owner", async function () {
                    const { mintingToken, owner } = await loadFixture(deployOneYearLockFixture);
                    expect(await mintingToken.safeMint(owner.address));
                });
              
                it("ERC721 - Safe Mint - Other Account", async function () {
                    const { mintingToken, otherAccount } = await loadFixture(deployOneYearLockFixture);
                    await expect(mintingToken.connect(otherAccount).safeMint(otherAccount.address)).eventually.to.rejectedWith(Error, "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner");
                }); 
                
                it("Deploy Auction's Contract", async function () {
                    const { mintingTokenForERC20 ,mintingToken, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);
                    expect(mintingToken.safeMint(owner.address));
                    
                    const nftDutchAuctionFactory = await ethers.getContractFactory("MyContract");
                    const nftDutchAuctionToken = await upgrades.deployProxy(
                        nftDutchAuctionFactory, 
                        [mintingTokenForERC20.address, mintingToken.address, 0, 200, 20, 10],
                        {
                            kind: "uups",
                            initializer: "initialize(address, address, uint256, uint256, uint256, uint256)",
                            timeout: 0
                        });
                    await nftDutchAuctionToken.deployed();
                    //const nftDutchAuctionToken = await nftDutchAuctionFactory.deploy(mintingTokenForERC20.address, mintingToken.address, 0, 200, 20, 10);
                     

                    describe("Bids", function(){
                        const deadline = ethers.constants.MaxUint256;

                        it("ERC20 Approval - Before", async function(){
                            await expect(nftDutchAuctionToken.connect(otherAccount).bid(400)).to.be.revertedWith('ERC20: insufficient allowance'); 
                        })

                        it("ERC20 Permit Rejection due to invalid signature", async function(){
                            const amount = 1000;
                            const deadline = constants.MaxUint256;
                            console.log(mintingTokenForERC20.address)
                            const {v, r, s} = await getPermitSignature(
                                owner,
                                mintingTokenForERC20,
                                nftDutchAuctionToken.address,
                                amount,
                                deadline
                            )
                            await expect(mintingTokenForERC20.permit(owner.address, nftDutchAuctionToken.address, 200, deadline, v, r, s)).to.be.revertedWith("ERC20Permit: invalid signature");
                        });

                        it("ERC20 Permit Process", async function(){
                            const amount = 1000;
                            const deadline = constants.MaxUint256;
                            console.log(mintingTokenForERC20.address)
                            const {v, r, s} = await getPermitSignature(
                                owner,
                                mintingTokenForERC20,
                                nftDutchAuctionToken.address,
                                amount,
                                deadline
                            )
                            await mintingTokenForERC20.permit(owner.address, nftDutchAuctionToken.address, amount, deadline, v, r, s);
                            //await mintingTokenForERC20.connect(otherAccount).approve(nftDutchAuctionToken.address, 200);
                            
                            describe("Post Approval Process", function(){
                                
                                it("Bid before ERC721 approval - Seller trying to bid", async function(){
                                    mintingTokenForERC20.mint(otherAccount.address, 400);
                                    // const otherAccountBal = await mintingTokenForERC20.balanceOf(otherAccount.address);
                                    // console.log(otherAccountBal)
                                    await expect(nftDutchAuctionToken.connect(owner).bid(210)).to.be.revertedWith('Seller is not permitted to bid');
                                })

                                it("Bid before ERC721 approval", async function(){
                                    mintingTokenForERC20.mint(otherAccount.address, 400);
                                    mintingTokenForERC20.connect(otherAccount).approve(nftDutchAuctionToken.address, 400)
                                    // const otherAccountBal = await mintingTokenForERC20.balanceOf(otherAccount.address);
                                    // console.log(otherAccountBal)
                                    await expect(nftDutchAuctionToken.connect(otherAccount).bid(400)).to.be.revertedWith('ERC721: caller is not token owner or approved');
                                })

                                it("Approving - Failure due to non-existent token id", async function(){
                                    await expect(mintingToken.approve(nftDutchAuctionToken.address, 9)).to.be.revertedWith('ERC721: invalid token ID');
                                });
                    
                                it("Approval - Failure - Not the owner", async function () {
                                    await expect(mintingToken.connect(otherAccount).approve(nftDutchAuctionToken.address,0)).to.be.revertedWith('ERC721: approve caller is not token owner or approved for all');
                                });
                                it("Approving", async function () {
                                    
                                    //const approvalResult = await mintingToken.approve(nftDutchAuctionToken.address, 0);
                                    expect(await mintingToken.approve(nftDutchAuctionToken.address,0));
                                    describe("Bid - After Approval", function () {
                                        it("Bid - Failure - Insufficient Funds", async function () {
                                            await expect(nftDutchAuctionToken.connect(otherAccount).bid(200)).to.be.revertedWith('Insufficient Funds');
                                        });
                    
                                        it("Bid - Failure - Less than reserve price", async function () {
                                            await expect(nftDutchAuctionToken.connect(otherAccount).bid(1)).to.be.revertedWith('Place a bid greater than reserve price');;
                                        });
                    
                                        it("Bid - Success", async function () {
                                            await expect(nftDutchAuctionToken.connect(otherAccount).bid(400));
                                        });
                    
                                        it("Bid - Failure - Closed Auction", async function () {
                                           await expect(nftDutchAuctionToken.connect(otherAccount).bid(410)).to.be.revertedWith('Auction is closed');;
                                        });
                                    });
                                    
                                });


                            })
                        });
                        
                       
                    })
            })

        })
    });
  });
});
});
