const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offercontroller");

router.post("/create", offerController.createOffer);
router.post("/accept", offerController.acceptOffer);

module.exports = router;
