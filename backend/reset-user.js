// Reset and recreate test user
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function resetUser() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✓ MongoDB connected");

        // Delete ALL existing test users (by user_id, email, and phone)
        const result = await User.deleteMany({
            $or: [
                { user_id: "USR1001" },
                { email: "p2p@example.com" },
                { phone: "+919876543210" }
            ]
        });

        if (result.deletedCount > 0) {
            console.log(`✓ Deleted ${result.deletedCount} existing user(s)`);
        } else {
            console.log("⚠ No existing users found");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash("password123", 10);

        // Create fresh test user
        const testUser = new User({
            user_id: "USR1001",
            name: "Test User",
            email: "p2p@example.com",
            password: hashedPassword,
            phone: "+919876543210",
            meter_id: "MTR001",
            transformer_id: "TRF001",
            grid_id: "GRID001",
            wallet_balance: 2450.75,
            energy_balance: 78.5,
            token_balance: 500,
            reserved_energy: 12.5,
            reserved_tokens: 50,
            total_energy_sold: 450.2,
            total_energy_bought: 120.5,
            total_imported_energy: 1250.8,
            total_exported_energy: 890.4,
            last_import_reading: 15420.5,
            last_export_reading: 4230.1,
            last_login: new Date(),
            created_at: new Date()
        });

        await testUser.save();

        console.log("✅ Test user recreated successfully!");
        console.log("==========================================");
        console.log("Email: p2p@example.com");
        console.log("Password: password123");
        console.log("Phone: +919876543210");
        console.log("==========================================");

        // Verify password works
        const match = await bcrypt.compare("password123", testUser.password);
        console.log("Password verification:", match ? "✅ WORKS" : "❌ FAILED");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

resetUser();
