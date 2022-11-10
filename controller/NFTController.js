


// To Use env file Variables
require('dotenv').config();

const Web3 = require("web3");

// Artifact of FixedCategoryContract 
const compileData = require("../artifacts/contracts/PNC721.sol/PNC721.json");

// To print statements on terminal without using console.log
const logger = require('../services/logger');

class NFT {
    /**
     * @desc deploy smart contract on pando blockchain
     * @author sakshi garg
     * @param {string} NFTName name of the NFT NFT
     * @param {string} NFTSymbol symbol of the NFT NFT
     * @returns {address} contract address
     */

    //http://localhost:18888/rpc" is eth rpc url
    async NFTContractAddress(req, res) {
        try {
            let { NFTName, NFTSymbol , PRIVATE_KEY} = req.body;
            logger.info(`200 : Input has validated successfully`);
            const web3 = await new Web3("http://localhost:18888/rpc")
            logger.info(`200 : Web3 connection with Blockchain has built successfully`);
            if(!PRIVATE_KEY){
                PRIVATE_KEY=process.env.PRIVATE_KEY
                if(!PRIVATE_KEY.startsWith('0x'))
                    PRIVATE_KEY="0x"+PRIVATE_KEY;
            }
            const account = await web3.eth.accounts.wallet.add(PRIVATE_KEY);
            logger.info(`200 : Account address : ${account.address}`);
            let abi = compileData.abi;
            let contractBytecode = compileData.bytecode;
            const result = await new web3.eth.Contract(abi).deploy({
                data: contractBytecode,
                arguments: [NFTName, NFTSymbol]
            })
                .send({ gas: "10000000", from: account.address })
            logger.info(`200 : Contract deployed to : ${result.options.address}`);
            res.json({ "contract address ": result.options.address });
        }
        catch (error) {
            logger.error(`500: error: ${error.message}`);
            res.status(500).json({ Error: "Internal Server Error" });
        }
    }

    /**
     * @desc get smart contract details from pando blockchain
     * @author sakshi garg
     * @param {string} address contract address of smart contract
     * @param {string} owner who has deploy the smart contract or has owner of particular supply of NFT 
     * @param {string} spender who has right to use that NFT on behalf of owner of that NFT
     * @param {string} methodName name of the function present on that smart contract
     * @param {number} tokenId 
     * @param {bytes4} interfaceId
     * @returns {number, string, boolean} return particular type of data
     */
    async readContract(req, res) {
        try {
            const { address, methodName, owner, spender, tokenId} = req.query;
            const web3 = await new Web3("http://localhost:18888/rpc")
            logger.info(`200 : Web3 connection with Blockchain has built successfully`);
            let abi = compileData.abi;
            const contract = await new web3.eth.Contract(abi, address)
            let result;

            if (methodName === "tokenURI" && tokenId) {
                result = await contract.methods.tokenURI(tokenId).call();
            }
            else if (methodName === "name") {
                console.log("true");
                result = await contract.methods.name().call();
            }
            else if (methodName === "owner") {

                result = await contract.methods.owner().call();
            }
            else if (methodName === "symbol") {

                result = await contract.methods.symbol().call();
            }
            else if (methodName === "balanceOf" && owner) {

                result = await contract.methods.balanceOf(owner).call();
            }
            else if (methodName === "getApproved" && tokenId) {

                result = await contract.methods.getApproved(tokenId).call();
            }
            else if (methodName === "ownerOf" && tokenId) {

                result = await contract.methods.ownerOf(tokenId).call();
            }
            else if (methodName === "isApprovedForAll" && owner && spender) {
                result = await contract.methods.isApprovedForAll(owner, spender).call();
            }
            if (!result && result !== false) {
                return res.status(404).send("Method name not found");
            }
            let resultString = `Contract call for ${methodName} and result is `;
            res.json({ resultString, result });
        }
        catch (error) {
            logger.error(`500: error: ${error.message}`);
            res.status(500).json({ Error: "Internal Server Error" });
        }
    }

    /**
     * @desc do transaction for particular function of smart contract on pando blockchain
     * @author sakshi garg
     * @param {string} address contract address of smart contract
     * @param {string} owner who has deploy the smart contract or has owner of particular supply of NFT 
     * @param {string} spender who has right to use that NFT on behalf of owner of that NFT
     * @param {string} methodName name of the function present on that smart contract
     * @param {string} recipientAddr whom address we want to send some NFT.
     * @param {number} tokenId
     * @param {boolean} approval for approve or dis-approve the spender request 
     * @returns {number, string, boolean} return particular type of data
     */
    async writeContract(req, res) {
        try {
            let { recipientAddr, address, methodName, owner, spender, tokenId, approval ,PRIVATE_KEY } = req.body
            const web3 = await new Web3("http://localhost:18888/rpc")
            logger.info(`200 : Web3 connection with Blockchain has built successfully`);
            if(!PRIVATE_KEY){
                PRIVATE_KEY=process.env.PRIVATE_KEY
                if(!PRIVATE_KEY.startsWith('0x'))
                    PRIVATE_KEY="0x"+PRIVATE_KEY;
            }
            const account = await web3.eth.accounts.wallet.add(PRIVATE_KEY);
            logger.info(`200 : Account address : ${account.address}`);
            let abi = compileData.abi;
            const contract = await new web3.eth.Contract(abi, address)
            let dataFunction;
            if (methodName === "safeTransferFrom" && owner && recipientAddr && tokenId) {
                dataFunction = contract.methods.safeTransferFrom(owner, recipientAddr, tokenId).encodeABI();
            }
            else if (methodName === "approve" && spender && tokenId) {
                dataFunction = contract.methods.approve(spender, tokenId).encodeABI()
            }
            else if (methodName === "renounceOwnership") {
                dataFunction = contract.methods.renounceOwnership().encodeABI()
            }
            else if (methodName === "safeMint" && tokenId && recipientAddr) {
                dataFunction = contract.methods.safeMint(recipientAddr, tokenId).encodeABI()
            }
            else if (methodName === "transferFrom" && owner && recipientAddr && tokenId) {
                dataFunction = contract.methods.transferFrom(owner, recipientAddr, tokenId).encodeABI()
            }
            else if (methodName === "transferOwnership" && owner) {
                dataFunction = contract.methods.transferOwnership(owner).encodeABI()
            }
            else if (methodName === "setApprovalForAll" && spender && approval) {
                dataFunction = contract.methods.setApprovalForAll(spender, approval).encodeABI()
            }
            const count = await web3.eth.getTransactionCount(account.address);
            if (!dataFunction) {
                return res.status(404).send("Method name not found");
            }
            const createTransaction = await web3.eth.accounts.signTransaction({
                "from": account.address,
                "nonce": web3.utils.toHex(count),
                "gas": web3.utils.toHex(2200000),
                "to": address,
                "data": dataFunction
            },
                process.env.PRIVATE_KEY
            );

            // Deploy transaction
            const createReceipt = await web3.eth.sendSignedTransaction(
                createTransaction.rawTransaction
            );

            logger.info(`Transaction successful with hash: ${createReceipt.transactionHash}`);
            logger.info(`Transaction details: ${JSON.stringify(createReceipt, null, "  ")}`);
            res.json({ "Transaction Detail": createReceipt });
        }
        catch (err) {
            logger.error(`500: error: ${err.message}`);
            res.status(500).json({ Error: "Internal Server Error" });
        }
    }
}
module.exports = new NFT();