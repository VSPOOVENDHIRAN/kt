const mongoose = require('mongoose');

const smartMeterUserSchema = new mongoose.Schema({
    meter_id: {
        type: String,
        required: true,
        unique: true, // Unique constraint is crucial for an ID field
        trim: true
    },
    phone: {
        type: String, // Kept as String for consistency and to handle potential leading zeros
        required: true,
        trim: true
    },
    grid_id: {
        type: String,
        required: true,
        trim: true
    },
    feeder_id: {
        type: String,
        required: true,
        trim: true
    },
    transformer_id: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        required: true,
        enum: ["inactive", "active"],
        default: "active"
    }
}); // Note: No second argument, so { timestamps: true } is not included

//const SmartMeterUser = mongoose.model('SmartMeterUser', smartMeterUserSchema);

module.exports = mongoose.model("SmartMeterUser", smartMeterUserSchema,"sm_devices");