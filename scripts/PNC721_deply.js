const { ethers } = require("hardhat");
async function main() {

    const PNC721Contract = await ethers.getContractFactory("PNC721");
    const pnc721Contract = await PNC721Contract.deploy(
        "PandoNFT", "PNC721");
    await pnc721Contract.deployed();
    console.log("PNC721Contract contract Address", pnc721Contract.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
