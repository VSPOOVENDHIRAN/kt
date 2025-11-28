const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },   // e.g., "USR1001"

  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },                // hashed password
  phone: { type: String, required: true, unique: true },     // login with email or phone

  //-----------------------------------------------------------
  // DEVICE / GRID LINKING
  //-----------------------------------------------------------
  meter_id: { type: String, required: true, unique: true, index: true },
  transformer_id: { type: String, required: true, trim: true },   // From sm_devices
  grid_id: { type: String, required: true },                     // Feeder/Area ID

  //-----------------------------------------------------------
  // WALLET
  //-----------------------------------------------------------
  wallet_balance: { type: Number, default: 0 },
  energy_balance: { type: Number, default: 0 }, 
  token_balance: { type: Number, default: 0 },

   // RESERVED (LOCKED) BALANCES
  reserved_energy: { type: Number, default: 0 }, // locked for sell offers
  reserved_tokens: { type: Number, default: 0 }, // locked for buy offers

  //-----------------------------------------------------------
  // ENERGY TRACKING (needed for future trade validation)
  //-----------------------------------------------------------
  total_energy_sold:    { type: Number, default: 0 },          // P2P sold (kWh)
  total_energy_bought:  { type: Number, default: 0 },          // P2P bought (kWh)

  total_imported_energy: { type: Number, default: 0 },          // From meter
  total_exported_energy: { type: Number, default: 0 },

  last_import_reading:   { type: Number, default: 0 },          // Highest meter reading
  last_export_reading:   { type: Number, default: 0 },

  //-----------------------------------------------------------
  // META
  //-----------------------------------------------------------
  last_login: { type: Date },
  created_at: { type: Date, default: Date.now }
});

// ENSURE COLLECTION NAME = users
module.exports = mongoose.model("User", userSchema, "users");
