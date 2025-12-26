require('dotenv').config();
const mongoose = require('mongoose');
const GovLedger = require('./models/govledger');
const Offer = require('./models/offers');
const User = require('./models/user');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function verifyData() {
    try {
        if (!MONGO_URI) {
            console.error('❌ MONGO_URI or MONGODB_URI not found in .env file');
            console.log('');
            console.log('Add this to backend/.env:');
            console.log('MONGO_URI=mongodb://localhost:27017/smart_meter_db');
            console.log('or');
            console.log('MONGODB_URI=mongodb://localhost:27017/smart_meter_db');
            process.exit(1);
        }

        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');
        console.log('Database:', mongoose.connection.name);
        console.log('');

        // Check collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📁 Collections in database:');
        collections.forEach(c => console.log(`  - ${c.name}`));
        console.log('');

        // Check GovLedger data
        const govLedgerCount = await GovLedger.countDocuments();
        console.log(`📊 GovLedger (gov_ledger): ${govLedgerCount} records`);
        if (govLedgerCount > 0) {
            const sample = await GovLedger.findOne();
            console.log('  Sample:', {
                user_id: sample.user_id,
                energy_kwh: sample.energy_kwh,
                amount_inr: sample.amount_inr
            });
        }
        console.log('');

        // Check Offers data
        const offersCount = await Offer.countDocuments();
        console.log(`📊 Offers: ${offersCount} records`);
        if (offersCount > 0) {
            const sample = await Offer.findOne();
            console.log('  Sample:', {
                offer_id: sample.offer_id,
                creator_id: sample.creator_id,
                units: sample.units,
                status: sample.status
            });
        }
        console.log('');

        // Check Users data
        const usersCount = await User.countDocuments();
        console.log(`📊 Users: ${usersCount} records`);
        if (usersCount > 0) {
            const sample = await User.findOne();
            console.log('  Sample:', {
                user_id: sample.user_id,
                name: sample.name,
                email: sample.email
            });
        }
        console.log('');

        // Summary
        console.log('='.repeat(50));
        if (govLedgerCount === 0 || offersCount === 0) {
            console.log('⚠️  DATABASE IS EMPTY OR INCOMPLETE');
            console.log('');
            console.log('Run this to add test data:');
            console.log('  npm run seed');
        } else {
            console.log('✅ DATABASE HAS DATA');
            console.log('');
            console.log('Backend APIs should return:');
            console.log(`  - /api/gov/eb-bills → ${govLedgerCount} EB bills`);
            console.log(`  - /api/offers/current → ${offersCount} offers`);
        }
        console.log('='.repeat(50));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verifyData();
