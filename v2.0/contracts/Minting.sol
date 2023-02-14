// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Minting is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    uint256 maxSupply;

    constructor(uint256 _maxSupply) ERC721("DutchAuctionTokens", "DAT") {
        maxSupply = _maxSupply;
    }

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        require(tokenId <= (maxSupply-1), "Max supply quota reached");
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }
}