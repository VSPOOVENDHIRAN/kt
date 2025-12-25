const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offercontroller");
const auth = require("../middleware/auth");  // correct path

// ---------------------- Offer Routes ----------------------
router.post("/create", offerController.createoffer);

router.post("/cancel", offerController.canceloffer);
router.post("/accept", offerController.acceptoffer);
module.exports = router;
