//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract BasicDutchAuction {
    uint256 public immutable reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public immutable offerPriceDecrement;
    uint256 immutable initialPrice;


    bool isAuctionOpen = true;

    uint256 immutable initialBlock;
    uint256 finalBlock;

    address public winnerOfTheAuction = address(0x0);
    
    address payable immutable seller;

    constructor(uint256 _reservePrice, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) {
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        seller = payable(msg.sender);
        
        initialPrice = _reservePrice + (_numBlocksAuctionOpen * _offerPriceDecrement);
        
        
        initialBlock = block.number;
        finalBlock = block.number + numBlocksAuctionOpen;
    }

    function getPrice() public view returns(uint256){
        return initialPrice - ((block.number - initialBlock) * offerPriceDecrement);
    }
    function bid() public payable returns(address) {
        require(isAuctionOpen, "Auction is closed");
        
        require(winnerOfTheAuction == address(0x0), "Winner is declared and auction is closed");

        require(msg.sender != seller, "Seller is not permitted to bid");

        require(block.number < finalBlock, "Rounds have exceeded and auction is closed");

        require(msg.value>= reservePrice, "Please enter a price greater than reserve price");

        require(address(this).balance>0, "Please recharge your wallet");
        uint256 price = getPrice();

        require(msg.value>=price, "Insufficient Funds");
        
        winnerOfTheAuction = msg.sender;

        seller.transfer(msg.value); 

        isAuctionOpen = false;

        return winnerOfTheAuction;
    }

    function getSellerAddress() public view returns(address){
        return seller;
    }
}