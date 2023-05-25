
const Search = props => {

    const handleChange = (e) => {
        props.onSearch(e.target.value);
    }
    return (
        <header>
            <h2 className="header__title">Search and Explores Homes!</h2>
            <input
                type="text"
                className="header__search"
                placeholder="Enter an address, neighborhood, city, or ZIP code"
                onChange={handleChange}
            />
        </header>
    );
}

export default Search;