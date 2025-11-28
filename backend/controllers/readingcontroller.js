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

    io.to(user._id.toString()).emit("new_reading", payload);

  } catch (e) {
    console.error("MQTT read error:", e);
  }
}

module.exports = handleIncomingReading ;
