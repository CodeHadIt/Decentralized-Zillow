//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    //houses the address of the NFT smart contract;
    address public nftAddress;
    //We made the address payable because it will be recieving an Ether sum: sale price;
    address payable public seller;
    address public lender;
    address public inspector;

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this function");
        _;
    }

    //reason why the modifier is taking a param is because the buyer needs to identify the corresponding NFT he wiches to purchase;
    modifier onlyBuyer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only buyer can call this function");
        _;
    }

    modifier onlyInspector {
        require(msg.sender == inspector, "Only inspector can call this function");
        _;
    }

    constructor(address _nftAddress, address payable _seller, address _lender, address _inspector) {
        nftAddress  = _nftAddress;
        seller = _seller;
        lender =_lender;
        inspector = _inspector;
    }

    receive() external payable{}

    function listProperty(uint256 _nftID, uint256 _purchasePrice, uint256 _escrowAmount, address _buyer) public payable onlySeller {
        //Gives us access to a version of the ERC721 contract and it's functions.
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _escrowAmount;
        buyer[_nftID] = _buyer;
    }

    function depositFunds(uint256 _nftID) public payable onlyBuyer(_nftID) {
        require(msg.value >= escrowAmount[_nftID]);
    }

    function updateInspectionStatus(uint256 _nftID, bool _passed) public onlyInspector {
        inspectionPassed[_nftID] = _passed;
    }
    
    //Approve sale function
    function approveSale(uint256 _nftID) public {
        approval[_nftID][msg.sender] = true;
    }


    //The ultimate function finalizing the sale;
    //Checks to make sure we have the approval if the buyer, seller and lender and that inspection passed is now true.
    function finalizeSale(uint256 _nftID) public {
        require(inspectionPassed[_nftID]);
        require(approval[_nftID][buyer[_nftID]]);
        require(approval[_nftID][seller]);
        require(approval[_nftID][lender]);
        require(address(this).balance >= purchasePrice[_nftID]);

        isListed[_nftID] = false;

        //Way to send the amount from the buyer to the seller
        (bool success,) = payable(seller).call{value: address(this).balance}("");
        require(success);

        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
    }

    function cancelSale(uint256 _nftID) public {
        //If the inspection has not been passed/Is not approved, send money from the contract address back to the buyer. If approved send to the seller
        if (inspectionPassed[_nftID] == false) {
            payable(buyer[_nftID]).transfer(address(this).balance);
        } else {
            payable(seller).transfer(address(this).balance);
        }
    }

    //Returns the balance of the smart contract address;
    function getBalance() public view returns(uint256) {
        //Address(this) is the current Smart contract address;
        return address(this).balance;
    }

}
