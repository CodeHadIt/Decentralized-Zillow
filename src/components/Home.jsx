import { useEffect, useState } from 'react';

import close from '../assets/close.svg';

const Home = ({ home, provider, account, escrow, handlePopUp}) => {
    const [buyer, setBuyer] = useState(null);
    const [lender, setLender] = useState(null);
    const [inspector, setInspector] = useState(null);
    const [seller, setSeller] = useState(null);

    const [hasBought, setHasBought] = useState(false)
    const [hasLent, setHaslent] = useState(false)
    const [hasInspected, setHasInspected] = useState(false)
    const [hasSold, setHasSold] = useState(false);

    const [owner, setOwner] = useState(null);

    const [cancelInitiated, setCancelInitiated] = useState(false);

    useEffect(()=>{
        fetchDetails();
        fetchOwner();
    }, [hasSold])

    const fetchDetails = async () => {
        //Buyer Actions
        const buyer = await escrow.buyer(home.id)
        setBuyer(buyer);

        const hasBought = await escrow.approval(home.id, buyer);
        setHasBought(hasBought);

        //Seller Actions
        const seller = await escrow.seller()
        setSeller(seller);

        const hasSold = await escrow.approval(home.id, seller);
        setHasSold(hasSold);

        //Lender Actions
        const lender = await escrow.lender()
        setLender(lender);
        const hasLent = await escrow.approval(home.id, lender);
        setHaslent(hasLent);

        //Inspector Actions
        const inspector = await escrow.inspector()
        setInspector(inspector);

        const hasInspected = await escrow.approval(home.id);
        setHasInspected(hasInspected);
    }

    const fetchOwner = async () => {
        if(await escrow.isListed(home.id)) return
        const owner = await escrow.buyer(home.id);
        setOwner(owner);
    }

    const handleBuy = async () => {
        const escrowAmount = await escrow.escrowAmount(home.id);
        //This is how we get the person to sign a transaction;
        const signer = await provider.getSigner();

        //Buy deposit transaction
        let transaction = await escrow.connect(signer).depositFunds(home.id, {value: escrowAmount});
        await transaction.wait();

        transaction = await escrow.connect(signer).approveSale(home.id);
        setHasBought(true);
    }

    const handleInspection = async () => {
        const signer = await provider.getSigner();      
        //Inspection
        const transaction = await escrow.connect(signer).updateInspectionStatus(home.id, true);
        await transaction.wait();
        setHasInspected(true);
    }

    const handleLend = async () => {
        const signer = await provider.getSigner();
        const transaction = await escrow.connect(signer).approveSale(home.id);
        await transaction.wait();

        //Lender sends funds
        const lendAmount = (await escrow.purchasePrice(home.id) - await escrow.escrowAmount(home.id));
        await signer.sendTransaction({to: escrow.address, value: lendAmount.toString(), gasLimit: 60000 });

        setHaslent(true);
    }

    const handleSale = async () => {
        const signer = await provider.getSigner();

        //Seller's Approval
        let transaction = await escrow.connect(signer).approveSale(home.id);
        await transaction.wait();

        //Seller finalizes
        transaction = await escrow.connect(signer).finalizeSale(home.id);
        await transaction.wait();

        setHasSold(true);
    }

    const handleCancelPopUp = (type) => {
        if(type == "open") {
            setCancelInitiated(true);
        } else if (type == "close") {
            setCancelInitiated(false);
        }
    };

    const handleCancelSale = async (id) => {
        const signer = await provider.getSigner();
        let transaction = await escrow.connect(signer).cancelSale(id);
        await transaction.wait();
        setCancelInitiated(false);
        setHasBought(false);
    }


    return (
      <div className="home">
        {!cancelInitiated && (
          <div className="home__details">
            <div className="home__image">
              <img src={home.image} alt="home" />
            </div>

            <div className="home__overview">
              <h1>{home.name}</h1>
              <p>
                <strong> {home.attributes[2].value}</strong> bds |
                <strong> {home.attributes[3].value}</strong> ba |
                <strong> {home.attributes[4].value}</strong> sqft |
              </p>
              <p>{home.address}</p>
              <h2>{home.attributes[0].value} ETH</h2>

              {owner ? (
                <div className="home__owned">
                  Owned by {owner.slice(0, 6) + "..." + owner.slice(38, 42)}
                </div>
              ) : (
                <div>
                  {account === inspector ? (
                    <button
                      className="home__buy"
                      onClick={handleInspection}
                      disabled={hasInspected}
                    >
                      Approve Inspection
                    </button>
                  ) : account === lender ? (
                    <button
                      className="home__buy"
                      onClick={handleLend}
                      disabled={hasLent}
                    >
                      Approve & Lend
                    </button>
                  ) : account === seller ? (
                    <>
                      <button
                        className="home__buy"
                        onClick={handleSale}
                        disabled={hasSold}
                      >
                        Approve & Sell
                      </button>
                      <button
                        className="cancel__btn"
                        onClick={() => handleCancelPopUp("open")}
                      >
                        Cancel Sale
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="home__buy"
                        onClick={handleBuy}
                        disabled={hasBought}
                      >
                        Buy
                      </button>
                      {hasBought && (
                        <button
                          className="cancel__btn"
                          onClick={() => handleCancelPopUp("open")}
                        >
                          Cancel Purchase
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              <hr />

              <h2>Overview</h2>

              <p>{home.description}</p>

              <hr />

              <h2>Facts and Features</h2>

              <ul>
                {home.attributes.map((attributes, index) => (
                  <li key={index}>
                    <strong>{attributes.trait_type}</strong> :{" "}
                    {attributes.value}
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={handlePopUp} className="home__close">
              <img src={close} alt="close" />
            </button>
          </div>
        )}
        {cancelInitiated && hasBought ? (
          <div className="cancel__sale">
            <h4>Are you sure you want to cancel the transaction?</h4>
            <button
              className={`cancel__btn yes`}
              onClick={() => handleCancelSale(home.id)}
            >
              Yes
            </button>
            <button
              className="cancel__btn"
              onClick={() => handleCancelPopUp("close")}
            >
              No
            </button>
          </div>
        ) : null}

        {cancelInitiated && !hasBought ? (
          <div className="cancel__sale">
            <h3>You Cannot cancel Yet</h3>
            <button
              className="cancel__btn"
              onClick={() => handleCancelPopUp("close")}
            >
              Okay
            </button>
          </div>
        ) : null}
      </div>
    );
}

export default Home;
