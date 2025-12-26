const mongoose = require('mongoose');

// 1. Define the Schema (as provided by you)
const readingSchema = new mongoose.Schema(
  {
    meter_id: String,
    timestamp: Date,
    period: String,
    voltage: Number,
    current: Number,
    power_watts: Number,
    import_kwh: Number,
    export_kwh: Number,
    status: String
  },
 { versionKey: false } 
);

module.exports =mongoose.model("Reading", readingSchema,"readings");