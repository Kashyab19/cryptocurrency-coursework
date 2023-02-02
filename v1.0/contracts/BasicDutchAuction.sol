//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract BasicDutchAuction {
    uint256 immutable reservePrice;
    uint256 numBlocksAuctionOpen;
    uint256 immutable offerPriceDecrement;
    uint256 immutable initialPrice;


    bool isAuctionOpen = true;

    uint256 immutable initialBlock;
    uint256 finalBlock;

    address public winnerOfTheAuction = address(0x0);
    //Owner of the contract
    address payable public immutable seller;

    constructor(uint256 _reservePrice, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) {
        require(_reservePrice>0 && _numBlocksAuctionOpen>0 && _offerPriceDecrement>0, "Set the basic parameters");
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
        //Checking if there is already a winner
        require(winnerOfTheAuction == address(0x0), "Auction is closed");

        require(msg.sender != seller, "Seller is not permitted to bid");

        require(block.number < finalBlock, "Rounds have exceeded");

        uint256 price = getPrice();

        require(msg.value>=price, "Insufficient Funds");
        
        winnerOfTheAuction = msg.sender;

        seller.transfer(msg.value); 

        return winnerOfTheAuction;
    }

    // function finalize() public {
        
    // }

    // function refund(uint256 refundAmount) public payable {

    // }
}