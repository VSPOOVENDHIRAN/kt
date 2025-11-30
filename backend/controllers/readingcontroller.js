const Reading = require("../models/reading");
const { findUserByMeterId } = require("../services/userservice"); // Corrected path

async function handleIncomingReading(topic, message, io) {
  try {
    const payload = JSON.parse(message.toString());

    if (!payload.meter_id) return console.error(" Missing meter_id");

    const user = await findUserByMeterId(payload.meter_id);
    if (!user) return console.error(" meter_id not linked");

    payload.import_kwh = Number(payload.import_kwh);
    payload.export_kwh = Number(payload.export_kwh);
    payload.timestamp = payload.timestamp || new Date();

    const doc = new Reading(payload);
    await doc.save();

    
    // --- Update user's last meter readings ---
    user.last_import_reading = payload.import_kwh;
    user.last_export_reading = payload.export_kwh;

    // Compute energy balance formula
    const last_import = user.last_import_reading;
    const last_export = user.last_export_reading;

    const bought = user.total_energy_bought|| 0;
    const sold = user.total_energy_sold || 0;

    user.energy_balance = last_export + bought - last_import - sold;

    await user.save();


   io.to(user._id.toString()).emit("new_reading", {
  energy_balance: user.energy_balance,
  last_import_reading: user.last_import_reading,
  last_export_reading: user.last_export_reading
});

  } catch (e) {
    console.error("MQTT read error:", e);
  }
}

module.exports = handleIncomingReading ;
