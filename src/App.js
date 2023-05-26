import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { RealEstateABI, EscrowABI } from "./contract-data/Abis";
import { RealEstateAddress, EscrowAddress } from './contract-data/contractAddress';

import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';



function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [escrowContract, setEscrowContract] = useState(null);
  const [allHomes, setAllHomes] = useState([])
  const [homes, setHomes] = useState([]);
  const [home, setHome] = useState({});
  const [poppedUp, setPoppedUp] = useState(false);

  useEffect(() =>{
    loadBlockchainData();
  }, [])


  const loadBlockchainData = async () => {
    //This will prompt a MM connect popup;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);


    //Importing the contract into our frontEnd;
    const RealEstateContract = new ethers.Contract(RealEstateAddress, RealEstateABI, provider);
    const totalSupply = await RealEstateContract.totalSupply();
    const AllHomes = [];

    for(let i = 1; i <= totalSupply; i++) {
      const uri = await RealEstateContract.tokenURI(i);
      const response = await fetch(uri);
      const metaData = await response.json();
      AllHomes.push(metaData);
    }
    setAllHomes(AllHomes);
    setHomes(AllHomes);

    const EscrowContract = new ethers.Contract(EscrowAddress, EscrowABI, provider)
    setEscrowContract(EscrowContract)

    //This runs when we chnage addresses;
    //This is an Ethereum event Listener;
    window.ethereum.on("accountsChanged", async () => {
      //This returns all the accounts on a MM wallet in an Array;
      //OnChange, the wallet we chnaged to will be number 1 or index 0 in the array;
      const accounts = await window.ethereum.request({method: "eth_requestAccounts"});
      //The wallet chnaged to at index 0 is then set to State as account;
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);
    });
  }

  const handleSearchedTerm = term => {
    filterHomes(term);
  }

  const filterHomes = value => {

    const filteredHomes = allHomes.filter((home) => {
      return home.address.toLowerCase().includes(value);
    });
    setHomes(filteredHomes);
  }

  const handlePopUp = (home) => {
    setHome(home);
    poppedUp ? setPoppedUp(false) : setPoppedUp(true);
  }
  

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />

      <Search onSearch={handleSearchedTerm} />
      <div className="cards__section">
        <h3>
          Your dream home on the <span className="accent">Blockchain</span>
        </h3>

        <hr />

        {homes.length > 0 ? (
          <div className="cards">
            {homes.map((home, index) => (
              <div
                className="card"
                key={index}
                onClick={() => handlePopUp(home)}
              >
                <div className="card__image">
                  <img src={home.image} alt="home" />
                </div>
                <div className="card__info">
                  <h4>{home.attributes[0].value} ETH</h4>
                  <p>
                    <strong>{home.attributes[2].value}</strong> bds |
                    <strong>{home.attributes[3].value}</strong> ba |
                    <strong>{home.attributes[4].value}</strong> sqft |
                  </p>
                  <p>{home.address}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <h2 className="not__found">
            Oops, Your home does not exist on the blockchain!
          </h2>
        )}
      </div>

      {poppedUp && (
        <Home
          home={home}
          provider={provider}
          account={account}
          escrow={escrowContract}
          handlePopUp={handlePopUp}
        />
      )}
    </div>
  );
}

export default App;
