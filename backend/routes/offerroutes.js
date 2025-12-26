const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offercontroller");
const authMiddleware = require("../middleware/auth");

router.post("/create", authMiddleware, offerController.createoffer);

router.post("/cancel", authMiddleware, offerController.canceloffer);
router.post("/accept", authMiddleware,offerController.acceptoffer);
module.exports = router;