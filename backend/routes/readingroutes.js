const express = require("express");
const router = express.Router();

const Reading = require("../models/reading");

router.get("/latest/:meter_id", async (req, res) => {
  try {
    const { meter_id } = req.params;

    const latest = await Reading.findOne({ meter_id })
      .sort({ timestamp: -1 });

    if (!latest)
      return res.status(404).json({ success: false, message: "No reading found" });

    res.json({ success: true, reading: latest });

  } catch (err) {
    console.error("Reading fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/history/:meter_id", async (req, res) => {
  try {
    const { meter_id } = req.params;

    const logs = await Reading.find({ meter_id })
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({ success: true, readings: logs });

  } catch (err) {
    console.error("Reading history error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
