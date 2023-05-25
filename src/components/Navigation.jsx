import logo from '../assets/logo.svg';


const Navigation = ({ account, setAccount }) => {

    const handleConnect = async () => {
         //This gets all the account in the MM wallet into an array
        const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
        console.log(accounts);
        //The first one clicked, which will be at index 0 is then set as our Account;
        setAccount(accounts[0])
    }

    return (
        <nav>
            <ul className='nav__links'>
                <li><a href="#">Buy</a></li>
                <li><a href="#">Rent</a></li>
                <li><a href="#">Sell</a></li>
            </ul>

            <div className='nav__brand'>
                <img src={logo} alt="Logo" />
                <h1>Millow</h1>
            </div>

            {account ? (
                <button
                    type="button"
                    className='nav__connect'
                >
                    {account.slice(0, 6) + '...' + account.slice(38, 42)}
                </button>
            ) : (
                <button
                    type="button"
                    className='nav__connect'
                    onClick={handleConnect}
                >
                    Connect
                </button>
            )}
        </nav>
    );

}

export default Navigation;
