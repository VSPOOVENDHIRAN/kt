const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  offer_id: { type: String, required: true, unique: true },
  offer_type: { type: String, required: true,enum: ["sell", "buy"]},
  creator_id: { type: String, required: true },       // user_id
  creator_meter: { type: String, required: true },
  transformerid: { type: String, required: true },
  units: { type: Number, required: true },            // kWh
  price_per_unit: { type: Number, required: true },
  total_price: { type: Number, required: true },
  status: { type: String, default: "open", enum: ["open", "negotiation", "accepted", "cancelled", "completed"] },
  negotiated_price: { type: Number, default: null },
  negotiated_by: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Offers", offerSchema, "offers");
