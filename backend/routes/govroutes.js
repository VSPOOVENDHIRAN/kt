const express = require("express");
const router = express.Router();
const govController = require("../controllers/govcontroller");
const auth = require("../middleware/auth");

router.get("/eb-bills", auth, govController.getAllEBBills);
router.get("/eb-bills/:user_id", auth, govController.getUserEBBill);

module.exports = router;
