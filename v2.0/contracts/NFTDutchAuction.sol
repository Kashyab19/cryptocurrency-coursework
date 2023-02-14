//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;
 
interface IMintingTokens{
     function safeTransferFrom(address from, address to, uint256 tokenId) external;
     function ownerOf(uint256 tokenId) external view returns(address owner);
}

contract NFTDutchAuction {
    uint256 immutable reservePrice;
    uint256 numBlocksAuctionOpen;
    uint256 immutable offerPriceDecrement;
    uint256 immutable initialPrice;
    uint256 immutable nftTokenId;

    bool isAuctionOpen = true;

    uint256 immutable initialBlock;
    uint256 finalBlock;

    address public winnerOfTheAuction = address(0x0);
    
    address payable immutable seller;
    
    IMintingTokens mint;

    address immutable erc721TokenAddress;

    constructor(address _erc721TokenAddress, uint256 _nftTokenId, uint256 _reservePrice, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) {
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        nftTokenId = _nftTokenId;
        erc721TokenAddress = _erc721TokenAddress;
        mint = IMintingTokens(erc721TokenAddress);
        seller = payable(msg.sender);

        require(msg.sender == mint.ownerOf(nftTokenId),"jj");
        
        initialPrice = _reservePrice + (_numBlocksAuctionOpen * _offerPriceDecrement);
        
        initialBlock = block.number;
        finalBlock = block.number + numBlocksAuctionOpen;
    }

    function getPrice() public view returns(uint256){
        return initialPrice - ((block.number - initialBlock) * offerPriceDecrement);
    }
    function bid() public payable returns(address) {
        require(isAuctionOpen, "Auction is closed");

        require(msg.sender != seller, "Seller is not permitted to bid");

        require(block.number < finalBlock, "Rounds have exceeded and auction is closed");

        require(msg.value>= reservePrice, "Place a bid greater than reserve price");

        require(address(this).balance>0, "Please recharge your wallet");
        
        uint256 price = getPrice();

        require(msg.value>=price, "Insufficient Funds");
        
        winnerOfTheAuction = msg.sender;

        mint.safeTransferFrom(seller, winnerOfTheAuction, nftTokenId);

        seller.transfer(msg.value); 

        isAuctionOpen = false;
        
        return winnerOfTheAuction;
    }

    function getSellerAddress() public view returns(address){
        return seller;
    }
}