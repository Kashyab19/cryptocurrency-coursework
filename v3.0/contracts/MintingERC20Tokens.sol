// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract MyToken is ERC20 {
    
    uint256 immutable maxSupply;
    uint256 circulatingSupply;

    constructor(uint256 _maxSupply) ERC20("Bid", "BIDS") {
        maxSupply = _maxSupply;
    }

    function getMaxSupply() public view returns(uint256){
        return maxSupply;
    }
    function mint(address to, uint256 amount) public {
        circulatingSupply = totalSupply();
        require(circulatingSupply < maxSupply, "Max Supply has reached");
        _mint(to, amount);
    }
}
