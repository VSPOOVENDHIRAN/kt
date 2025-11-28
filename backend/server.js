// ---------------------- Load ENV Variables ----------------------
require("dotenv").config();

// ---------------------- Core Imports ----------------------
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

// MQTT import
const { initMQTT } = require("./services/mqttservice");

// ---------------------- ENV Config ----------------------
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

// ---------------------- App Initialization ----------------------
const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());
app.use(bodyParser.json());

// ---------------------- MongoDB Connect ----------------------
mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB error:", err));

// ---------------------- Socket.IO Setup ----------------------
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("register_user", (userId) => {
        socket.join(userId);
        console.log(`User joined room: ${userId}`);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// Save io globally
app.set("io", io);

// ---------------------- Initialize MQTT ----------------------
initMQTT(
    process.env.MQTT_BROKER,
    process.env.MQTT_TOPIC,
    io
);

// ---------------------- Routes ----------------------
const authRoutes = require("./routes/authroutes");
app.use("/api/auth", authRoutes);

const offerRoutes = require("./routes/offerroutes");
app.use("/api/offers", offerRoutes);

app.get("/", (req, res) => {
    res.send("P2P Energy Trading API running.");
});

// ---------------------- Start Server ----------------------
server.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});
