const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  offer_id: { type: String, required: true, unique: true },
  offer_type: { type: String, required: true,enum: ["sell", "buy"]},
  creator_id: { type: String, required: true },       // user_id
  creator_meter: { type: String, required: true },
  transformer_id: { type: String, required: true },
  units: { type: Number, required: true },
  token_per_unit: { type: Number, required: true },
  total_tokens: { type: Number, required: true },
  status: { type: String, default: "open", enum: ["open", "negotiation", "accepted", "cancelled", "completed"] },
  negotiated_tokens: { type: Number, default: null },
  negotiated_by: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  completed_at: { type: Date, default: null }
});

module.exports = mongoose.model("Offer", offerSchema, "offers");

