const mqtt = require("mqtt");
const handleIncomingReading = require("../controllers/readingcontroller"); // <-- correct relative path

function initMQTT(brokerURL, topic, io) {
  const client = mqtt.connect(brokerURL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    protocol: "mqtts",
    port: 8883,
  });

  client.on("connect", () => {
    console.log(" MQTT connected");
    client.subscribe(topic, (err) => {
      if (err) console.log(" MQTT subscribe error", err);
      else console.log(" Subscribed:", topic);
    });
  });

  client.on("message", async (topic, message) => {   //listen for messages
    await handleIncomingReading(topic, message, io);
  });

  client.on("error", (err) => console.log("MQTT error:", err));

  return client;
}

module.exports = { initMQTT };
