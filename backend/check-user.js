// Check user in database
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function checkUser() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✓ MongoDB connected");

        const user = await User.findOne({ email: "p2p@example.com" });

        if (!user) {
            console.log("❌ User NOT found in database!");
            console.log("Run: node seed.js to create the user");
            process.exit(1);
        }

        console.log("✅ User found in database!");
        console.log("==========================================");
        console.log("User ID:", user.user_id);
        console.log("Name:", user.name);
        console.log("Email:", user.email);
        console.log("Phone:", user.phone);
        console.log("Password Hash:", user.password.substring(0, 20) + "...");
        console.log("==========================================");

        // Test password
        const testPassword = "password123";
        const match = await bcrypt.compare(testPassword, user.password);

        if (match) {
            console.log("✅ Password 'password123' is CORRECT!");
        } else {
            console.log("❌ Password 'password123' does NOT match!");
            console.log("The password in database is different.");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

checkUser();
