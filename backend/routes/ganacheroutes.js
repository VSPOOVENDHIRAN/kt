const express = require("express");
const ganachcontroller = require("../controllers/ganachecontroller"); // no {}

const router = express.Router();

// Start Ganache
router.get("/balance", ganachcontroller.get_balance);
router.post("/send-transaction", ganachcontroller.send_transaction);

router.post("/start-ganache", ganachcontroller.start_ganache);
router.get("/accounts", ganachcontroller.get_accounts);
// BUY history → to = address
router.get("/history", ganachcontroller.get_offer_history);
/*router.get("/history/buy/:address", async (req, res) => {
    try {
        const history = await ganachcontroller.get_offer_history(req.params.address, "BUY");
        res.json({
            type: "BUY",
            address: req.params.address,
            total: history.length,
            history
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SELL history → from = address
router.get("/history/sell/:address", async (req, res) => {
    try {
        const history = await ganachcontroller.getOfferHistory(req.params.address, "SELL");
        res.json({
            type: "SELL",
            address: req.params.address,
            total: history.length,
            history
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
*/
module.exports = router;
