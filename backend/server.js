// ---------------------- Load ENV Variables ----------------------
require("dotenv").config();

// ---------------------- Core Imports ----------------------
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

// ---------------------- ENV Config ----------------------
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
const MQTT_BROKER = process.env.MQTT_BROKER;
const MQTT_TOPIC = process.env.MQTT_TOPIC;

// ---------------------- App Initialization ----------------------
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// ---------------------- MongoDB Connect ----------------------
mongoose.connect(MONGO_URI)
    .then(() => console.log(" MongoDB connected"))
    .catch(err => console.error(" MongoDB error:", err));

// ---------------------- Socket.IO Setup ----------------------
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
    console.log(" Client connected:", socket.id);

    socket.on("register_user", (userId) => {
        socket.join(userId);
        console.log(` User joined room: ${userId}`);
    });

    socket.on("disconnect", () => {
        console.log(" Client disconnected:", socket.id);
    });
});

// ---------------------- Routes ----------------------
const authRoutes = require("./routes/authroutes");
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("P2P Energy Trading API running.");
});

// ---------------------- MQTT Service ----------------------
const { initMQTT } = require("./services/mqttservice");
initMQTT(MQTT_BROKER, MQTT_TOPIC, io);

// ---------------------- Cron Job ----------------------
require("./cron/dailyaggregation");
app.set("io", io);


// ---------------------- Start Server ----------------------
server.listen(PORT, () => {
    console.log(` Backend running on port ${PORT}`);
    console.log(` http://localhost:${PORT}`);
});
