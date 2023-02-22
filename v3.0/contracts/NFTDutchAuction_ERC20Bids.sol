//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;
 
interface IERC721Custom{
     function safeTransferFrom(address from, address to, uint256 tokenId) external;
     function ownerOf(uint256 tokenId) external view returns(address owner);
}

interface IERC20Custom{
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
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
    
    IERC721Custom ierc721;
    IERC20Custom ierc20;

    address immutable erc721TokenAddress;
    address immutable erc20TokenAddress;

    constructor(address _erc20TokenAddress, address _erc721TokenAddress, uint256 _nftTokenId, uint256 _reservePrice, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) {
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        nftTokenId = _nftTokenId;
        erc721TokenAddress = _erc721TokenAddress;
        erc20TokenAddress = _erc20TokenAddress;
        ierc721 = IERC721Custom(erc721TokenAddress);
        ierc20 = IERC20Custom(erc20TokenAddress);

        seller = payable(msg.sender);

        require(msg.sender == ierc721.ownerOf(nftTokenId),"Owner doesn't have ERC 721 tokens");
        
        initialPrice = _reservePrice + (_numBlocksAuctionOpen * _offerPriceDecrement);
        
        initialBlock = block.number;
        finalBlock = block.number + numBlocksAuctionOpen;
    }

    function getPrice() public view returns(uint256){
        return initialPrice - ((block.number - initialBlock) * offerPriceDecrement);
    }

    function getBalanceOfEOA() public view returns(uint256){
        return ierc20.balanceOf(msg.sender);
    }
    function bid(uint256 amount) public payable returns(address) {
        require(isAuctionOpen, "Auction is closed");

        require(msg.sender != seller, "Seller is not permitted to bid");

        require(block.number < finalBlock, "Auction is closed");

        require(amount >= reservePrice, "Place a bid greater than reserve price");

        uint256 price = getPrice();

        require(amount >= price, "Insufficient Funds");
        
        winnerOfTheAuction = msg.sender;

        ierc20.transferFrom(msg.sender, seller, amount);

        ierc721.safeTransferFrom(seller, winnerOfTheAuction, nftTokenId);

        isAuctionOpen = false;
        
        return winnerOfTheAuction;
    }

    function getSellerAddress() public view returns(address){
        return seller;
    }
}