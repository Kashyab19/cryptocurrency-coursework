// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IERC721Custom{
     function safeTransferFrom(address from, address to, uint256 tokenId) external;
     function ownerOf(uint256 tokenId) external view returns(address owner);
}

interface IERC20Custom{
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

contract MyContract is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    uint256 reservePrice;
    uint256 numBlocksAuctionOpen;
    uint256 offerPriceDecrement;
    uint256 initialPrice;
    uint256 nftTokenId;

    bool isAuctionOpen;

    uint256 initialBlock;
    uint256 finalBlock;

    address public winnerOfTheAuction;
    
    address payable seller;
    
    IERC721Custom ierc721;
    IERC20Custom ierc20;

    address erc721TokenAddress;
    address erc20TokenAddress;

    function initialize(address _erc20TokenAddress, address _erc721TokenAddress, uint256 _nftTokenId, uint256 _reservePrice, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        winnerOfTheAuction = address(0);
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

        isAuctionOpen = true;
    }

    function getPrice() public view returns(uint256){
        return initialPrice - ((block.number - initialBlock) * offerPriceDecrement);
    }

    function bid(uint256 amount) public payable returns(address) {
        require(isAuctionOpen, "Auction is closed");

        require(msg.sender != seller, "Seller is not permitted to bid");

        require(block.number < finalBlock, "Rounds have exceeded and auction is closed");

        require(amount >= reservePrice, "Place a bid greater than reserve price");

        
        uint256 price = getPrice();

        require(amount >= price, "Insufficient Funds");
        
        winnerOfTheAuction = msg.sender;

        ierc20.transferFrom(msg.sender, seller, amount);

        ierc721.safeTransferFrom(seller, winnerOfTheAuction, nftTokenId);

        isAuctionOpen = false;
        
        return winnerOfTheAuction;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}