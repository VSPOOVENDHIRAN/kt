const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offercontroller");
const auth = require("../middleware/auth");  // correct path

// ---------------------- Offer Routes ----------------------
router.post("/create", offerController.createoffer);
router.post("/negotiate", offerController.negotiateoffer);
router.post("/cancel", offerController.canceloffer);
router.post("/accept", offerController.acceptoffer);
router.post("/cancelnegotiation", offerController.cancelnegotiation);
router.get("/closed/30days", auth,offerController.getClosedOffersLast30Days);
router.get("/current/own", auth, offerController.getOwnTradeOffers);
router.get("/current", auth, offerController.getCurrentTradeOffers);
module.exports = router;
