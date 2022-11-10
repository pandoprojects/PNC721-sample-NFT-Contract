const express = require('express');
const router = express.Router();
const NFT = require('../controller/NFTController');
const linkValidate = require('../middleware/linkVAlidation');

router.post("/", linkValidate, NFT.NFTContractAddress);
router.get("/", linkValidate, NFT.readContract);
router.post("/write/", linkValidate, NFT.writeContract);
module.exports = router;