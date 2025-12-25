// Seed script to create test users and offers
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");
const Offer = require("./models/offers");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log("✓ MongoDB connected");

        // 1. Check for Users or Create Them
        const existingUsers = await User.countDocuments();
        let sellerId, buyerId, transformerId;

        if (existingUsers === 0) {
            console.log("No users found. Creating demo users...");
            const hashedPassword = await bcrypt.hash("password123", 10);

            const seller = new User({
                user_id: "USR1001",
                name: "Solar Seller",
                email: "seller@test.com",
                phone: "+911111111111",
                password: hashedPassword,
                meter_id: "METER001",
                transformer_id: "TF-001",
                grid_id: "GRID-A",
                wallet_balance: 2000,
                energy_balance: 100,
                token_balance: 50,
                reserved_energy: 0,
                reserved_tokens: 0,
                total_energy_sold: 250,
                total_energy_bought: 50,
                total_imported_energy: 800,
                total_exported_energy: 600,
                last_import_reading: 5000,
                last_export_reading: 2000,
                last_login: new Date(),
                created_at: new Date()
            });
            await seller.save();

            const buyer = new User({
                user_id: "USR1002",
                name: "Energy Buyer",
                email: "buyer@test.com",
                phone: "+912222222222",
                password: hashedPassword,
                meter_id: "METER002",
                transformer_id: "TF-001",
                grid_id: "GRID-A",
                wallet_balance: 3000,
                energy_balance: 10,
                token_balance: 500,
                reserved_energy: 0,
                reserved_tokens: 0,
                total_energy_sold: 50,
                total_energy_bought: 300,
                total_imported_energy: 1200,
                total_exported_energy: 200,
                last_import_reading: 8000,
                last_export_reading: 1000,
                last_login: new Date(),
                created_at: new Date()
            });
            await buyer.save();

            const mainUser = new User({
                user_id: "USR1003",
                name: "Test User",
                email: "p2p@example.com",
                phone: "+919876543210",
                password: hashedPassword,
                meter_id: "METER003",
                transformer_id: "TF-001",
                grid_id: "GRID-A",
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
            await mainUser.save();

            sellerId = seller.user_id;
            buyerId = buyer.user_id;
            transformerId = seller.transformer_id;
            console.log("✅ Created 3 demo users:");
            console.log("   - USR1001 (Solar Seller) - seller@test.com");
            console.log("   - USR1002 (Energy Buyer) - buyer@test.com");
            console.log("   - USR1003 (Test User) - p2p@example.com");
            console.log("   Password for all: password123");

        } else {
            console.log(`✓ Found ${existingUsers} existing users. Using them for offers...`);
            const users = await User.find().limit(2);
            if (users.length > 0) {
                sellerId = users[0].user_id;
                transformerId = users[0].transformer_id;
            }
            if (users.length > 1) {
                buyerId = users[1].user_id;
            } else {
                buyerId = sellerId; // fallback
            }
        }

        // 2. Create Sample Offers
        console.log("\n📊 Seeding Offers...");

        // Clear existing offers for fresh start
        const deletedCount = await Offer.deleteMany({});
        if (deletedCount.deletedCount > 0) {
            console.log(`   Cleared ${deletedCount.deletedCount} old offers`);
        }


        const offers = [
            // Seller's offers (will show in "Your Active Offers" for seller@test.com)
            {
                offer_id: "OFF" + Math.floor(Math.random() * 10000),
                offer_type: "sell",
                creator_id: sellerId,
                creator_meter: "METER001",
                transformer_id: transformerId,
                units: 25,
                token_per_unit: 5,
                total_tokens: 125,
                status: "open",
                created_at: new Date(Date.now() - 3600000) // 1 hour ago
            },
            {
                offer_id: "OFF" + Math.floor(Math.random() * 10000),
                offer_type: "sell",
                creator_id: sellerId,
                creator_meter: "METER001",
                transformer_id: transformerId,
                units: 50,
                token_per_unit: 4.5,
                total_tokens: 225,
                status: "open",
                created_at: new Date(Date.now() - 7200000) // 2 hours ago
            },
            {
                offer_id: "OFF" + Math.floor(Math.random() * 10000),
                offer_type: "sell",
                creator_id: sellerId,
                creator_meter: "METER001",
                transformer_id: transformerId,
                units: 15,
                token_per_unit: 6,
                total_tokens: 90,
                status: "open",
                created_at: new Date(Date.now() - 1800000) // 30 min ago
            },

            // Buyer's offers (will show in "Your Active Offers" for buyer@test.com)
            {
                offer_id: "OFF" + Math.floor(Math.random() * 10000),
                offer_type: "buy",
                creator_id: buyerId,
                creator_meter: "METER002",
                transformer_id: transformerId,
                units: 30,
                token_per_unit: 4,
                total_tokens: 120,
                status: "open",
                created_at: new Date(Date.now() - 5400000) // 1.5 hours ago
            },
            {
                offer_id: "OFF" + Math.floor(Math.random() * 10000),
                offer_type: "buy",
                creator_id: buyerId,
                creator_meter: "METER002",
                transformer_id: transformerId,
                units: 20,
                token_per_unit: 5.5,
                total_tokens: 110,
                status: "open",
                created_at: new Date(Date.now() - 900000) // 15 min ago
            },

            // Market offers from other users (will show in "Market Offers Near You" for p2p@example.com)
            {
                offer_id: "OFF" + Math.floor(Math.random() * 10000),
                offer_type: "sell",
                creator_id: "USR2001", // Different user
                creator_meter: "METER201",
                transformer_id: transformerId,
                units: 40,
                token_per_unit: 4.8,
                total_tokens: 192,
                status: "open",
                created_at: new Date(Date.now() - 10800000) // 3 hours ago
            },
            {
                offer_id: "OFF" + Math.floor(Math.random() * 10000),
                offer_type: "sell",
                creator_id: "USR2002",
                creator_meter: "METER202",
                transformer_id: transformerId,
                units: 60,
                token_per_unit: 4.2,
                total_tokens: 252,
                status: "open",
                created_at: new Date(Date.now() - 14400000) // 4 hours ago
            },
            {
                offer_id: "OFF" + Math.floor(Math.random() * 10000),
                offer_type: "sell",
                creator_id: "USR2003",
                creator_meter: "METER203",
                transformer_id: transformerId,
                units: 35,
                token_per_unit: 5.2,
                total_tokens: 182,
                status: "open",
                created_at: new Date(Date.now() - 7200000) // 2 hours ago
            },
            {
                offer_id: "OFF" + Math.floor(Math.random() * 10000),
                offer_type: "sell",
                creator_id: "USR2004",
                creator_meter: "METER204",
                transformer_id: transformerId,
                units: 45,
                token_per_unit: 4.6,
                total_tokens: 207,
                status: "open",
                created_at: new Date(Date.now() - 3600000) // 1 hour ago
            },
            {
                offer_id: "OFF" + Math.floor(Math.random() * 10000),
                offer_type: "sell",
                creator_id: "USR2005",
                creator_meter: "METER205",
                transformer_id: transformerId,
                units: 28,
                token_per_unit: 5.8,
                total_tokens: 162.4,
                status: "open",
                created_at: new Date(Date.now() - 1800000) // 30 min ago
            },
            {
                offer_id: "OFF" + Math.floor(Math.random() * 10000),
                offer_type: "sell",
                creator_id: "USR2006",
                creator_meter: "METER206",
                transformer_id: transformerId,
                units: 55,
                token_per_unit: 4.4,
                total_tokens: 242,
                status: "open",
                created_at: new Date(Date.now() - 5400000) // 1.5 hours ago
            },
            {
                offer_id: "OFF" + Math.floor(Math.random() * 10000),
                offer_type: "sell",
                creator_id: "USR2007",
                creator_meter: "METER207",
                transformer_id: transformerId,
                units: 32,
                token_per_unit: 5.5,
                total_tokens: 176,
                status: "open",
                created_at: new Date(Date.now() - 900000) // 15 min ago
            },
            {
                offer_id: "OFF" + Math.floor(Math.random() * 10000),
                offer_type: "buy",
                creator_id: "USR2008",
                creator_meter: "METER208",
                transformer_id: transformerId,
                units: 25,
                token_per_unit: 5.0,
                total_tokens: 125,
                status: "open",
                created_at: new Date(Date.now() - 10800000) // 3 hours ago
            }
        ];

        for (const o of offers) {
            await new Offer(o).save();
        }

        console.log(`✅ Successfully added ${offers.length} offers!`);
        console.log("\n==========================================");
        console.log("🎉 Database seeded successfully!");
        console.log("==========================================");
        console.log("Login credentials:");
        console.log("  Email: p2p@example.com");
        console.log("  Password: password123");
        console.log("==========================================");

        process.exit(0);

    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
}

seedDatabase();
