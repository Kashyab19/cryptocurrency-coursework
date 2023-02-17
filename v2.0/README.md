# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

----------------------|----------|----------|----------|----------|----------------|
File                  |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
----------------------|----------|----------|----------|----------|----------------|
 contracts/           |      100 |    77.78 |      100 |      100 |                |
  Minting.sol         |      100 |       75 |      100 |      100 |                |
  NFTDutchAuction.sol |      100 |    78.57 |      100 |      100 |                |
----------------------|----------|----------|----------|----------|----------------|
All files             |      100 |    77.78 |      100 |      100 |                |
----------------------|----------|----------|----------|----------|----------------|


 Tests
    Mint
      ✔ Safe Mint - Owner (865ms)
      ✔ Safe Mint - Other Account
      ✔ Mint Successfully and Deploy Auction's Contract (71ms)

  Bid - before approval
    ✔ Bid - Seller trying to bid
    ✔ Bid - Without approval from Minting Contract
    ✔ Approving - Failure due to non-existent token id
    ✔ Approval - Failure - Not the owner
    ✔ Approving (40ms)

  Bid - After Approval
    ✔ Bid - Failure - Insufficient Funds
    ✔ Bid - Failure - Less than reserve price
    ✔ Bid - Success
    ✔ Bid - Failure - Closed Auction (38ms)