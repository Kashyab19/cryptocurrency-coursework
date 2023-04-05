import React, { useEffect, useState } from "react";
import "./App.css";
import { ethers, Contract, Signer } from "ethers";
import abi from "./utils/BasicDutchAuction.json";

const getEthereumObject = () => window.ethereum;


const findMetaMaskAccount = async () => {
  try {
    const ethereum = getEthereumObject();

    /*
     * First make sure we have access to the Ethereum object.
     */
    if (!ethereum) {
      console.error("Make sure you have Metamask!");
      return null;
    }

    console.log("We have the Ethereum object", ethereum);
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      return account;
    } else {
      console.error("No authorized account found");
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");

  const [currentAccount, setCurrentAccount] = useState("");
  
  const [contractParameters, setContractParameters] = useState({
    reservePrice : "",
    numberOfRounds: "",
    priceDecrement:""
  });

  const[contractAddressDeployed, setContractAddressDeployed] = useState("")

  const[deployedContractObject, setDeployedContractObject] = useState("")

  const  [bid, placeBid] = useState({
    contractAddress : "",
    bidAsk:""
  })

  const [lookUpInformation, setLookUpInformation] = useState({
    winner:"",
    currentPrice:"",
    reservePrice: "",
    offerPriceDecrement:"",
    numberOfRounds:""
  })

  const contractAddress = "";
  const contractABI = abi.abi;
  const contractBytecode = abi.bytecode;

  var winner = "";
  var currentPrice = "";

  const connectWallet = async (e) => {
    e.preventDefault();
    try {
      const ethereum = getEthereumObject();
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const connectedAddress = await signer.getAddress();
      setAddress(connectedAddress);
      setIsConnected(true);
      console.log(connectedAddress)
    } catch (error) {
      console.error(error);
    }
  };

  const deployContract = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const ContractFactory = new ethers.ContractFactory(contractABI, contractBytecode, signer);
    const contract = await ContractFactory.deploy(contractParameters.reservePrice, contractParameters.numberOfRounds, contractParameters.priceDecrement);
    await contract.deployed();
    console.log("Contract deployed at address:", contract.address);
    const deployedContract = new ethers.Contract(contract.address, contractABI, signer);
    setContractAddressDeployed(deployedContract.address)
    setDeployedContractObject(deployedContract);
    console.log(await deployedContract.getSellerAddress())
  }

  useEffect(() => {
    const fetchData = async () =>{
      const account = await findMetaMaskAccount();
      if (account !== null) {
        setCurrentAccount(account);
      }
      fetchData();
    }
    
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    setContractParameters({
      ...contractParameters,
      [e.target.name]: e.target.value,
      
    })

    placeBid({
      ...bid,
      [e.target.name]: e.target.value
    })
}

const placeABid = async (e) =>{
  e.preventDefault();
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const deployedContract = new ethers.Contract(bid.contractAddress, contractABI, signer);
    const result = await deployedContract.bid({value: bid.bidAsk});
    if(result){
      window.alert("You are winner of the auction!")
    }
  } catch (error) {
    window.alert(error.reason);
    console.log(error.reason)
  }
  
}

const lookUpInfo = async (e) =>{
  e.preventDefault();
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const deployedContract = new ethers.Contract(bid.contractAddress, contractABI, signer);
    console.log(deployedContract);
    winner = await deployedContract.winnerOfTheAuction();
    currentPrice = await deployedContract.getPrice();

    var reservePriceLocalVar = await deployedContract.reservePrice();
    var offerPriceDecrementLocalVar = await deployedContract.offerPriceDecrement();
    var numberOfRoundsLocalVar = await deployedContract.numBlocksAuctionOpen();

    
    if(winner == "0x0000000000000000000000000000000000000000"){
      winner = "No winner yet"
    }

    setLookUpInformation({
      winner: winner,
      currentPrice: parseInt(currentPrice, 10),
      reservePrice: parseInt(reservePriceLocalVar, 10),
      numberOfRounds: parseInt(numberOfRoundsLocalVar, 10),
      offerPriceDecrement: parseInt(offerPriceDecrementLocalVar, 10)
    })

  } catch (error) {
    window.alert(error.reason);
    console.log(error.reason)
  }
  
}
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <h1 className="header">
          👋 Dutch Auction
        </h1>
        
        <hr></hr>
       
        {!isConnected && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {isConnected && (
          <h4>Your metamask wallet is connected to {address}</h4>
        )}

      <hr></hr>
      <h2 className="header">
          Deploy section
      </h2>

      <div className="deploy-section">
        <label for="Reserve Price" name="reserve-price">Reserve Price/Base Price</label>&nbsp;
        <input type="number" name="reservePrice" onChange={handleChange} value={contractParameters.reservePrice}></input>
        <br/>

        <label for="Number of rounds">Number of rounds for the auction to go on</label>&nbsp;
        <input type="number" name="numberOfRounds" onChange={handleChange} value={contractParameters.numberOfRounds}></input>
        <br/>

        <label for="Number of rounds">Price to be decremented after reach round</label>&nbsp;
        <input type="number" name="priceDecrement" onChange={handleChange} value={contractParameters.priceDecrement}></input>
        <br/>

        <button className="deploy-button" onClick = {deployContract}>
            Deploy
        </button>
         
         <h3> Contract is deployed to {contractAddressDeployed}</h3>
         
      </div>

      <hr></hr>
      <h2 className="header">
          Bid Section
      </h2>

      <div className="deploy-section">
        <label for="Contract Address" name="reserve-price">Contract Address</label>&nbsp;
        <input type="text" name="contractAddress" value={bid.contractAddress} onChange={handleChange}></input>
        <br/>

        <label for="Number of rounds">Bid ask</label>&nbsp;
        <input type="number" name="bidAsk" value={bid.bidAsk} onChange={handleChange}></input>
        <br/>

        <button className="deploy-button" onClick={placeABid}>
            Bid
        </button>
         
      </div>

      <hr></hr>

      <h2 className="header">
          Look up info
      </h2>

      <div className="deploy-section">
        <label for="Contract Address" name="reserve-price">Contract Address</label>&nbsp;
        <input type="text" name="contractAddress" value={bid.contractAddress} onChange={handleChange}></input>
        <br/>

        <button className="deploy-button" onClick={lookUpInfo}>
            Show info
        </button>
        
        <h3>Winner: {lookUpInformation.winner}</h3>
        <h3>Reserve Price: {lookUpInformation.reservePrice}</h3>
        <h3>Number of rounds: {lookUpInformation.numberOfRounds}</h3>
        <h3>Offer Price Decrement: {lookUpInformation.offerPriceDecrement}</h3>
        <h3>Current Price: {lookUpInformation.currentPrice}</h3>
         
      </div>

      <hr></hr>

      </div>
    </div>
  );
};

export default App;