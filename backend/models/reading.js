// backend/models/reading.js

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
 { versionKey: false } // removes __v and speeds up writes
);

// 2. Compile the Schema into a Model
// This creates a constructor function (the Model) named 'Reading'
//const Reading = mongoose.model('Reading', readingSchema,);

// 3. Export the Model
// This ensures that when other files 'require' this file, they get the Mongoose Model constructor
module.exports =mongoose.model("Reading", readingSchema,"readings");