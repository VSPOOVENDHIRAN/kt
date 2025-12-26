const mongoose = require('mongoose');
const GovLedger = require('./models/govledger');
const User = require('./models/user');
const Offer = require('./models/offers');
require('dotenv').config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await GovLedger.deleteMany({});
        await Offer.deleteMany({});
        console.log('Cleared existing data');

        // Create test EB bill data
        const testLedgerData = [
            {
                transaction_id: 'TXN001',
                user_id: 'USER001',
                meter_id: 'MTR001',
                transaction_type: 'IMPORT',
                energy_kwh: 150.5,
                amount_inr: 977.25,
                rate_per_kwh: 6.5,
                billing_period: '2024-12',
                metadata: {
                    reference_number: 'EB2024120001',
                    transformer_id: 'TRF001'
                }
            },
            {
                transaction_id: 'TXN002',
                user_id: 'USER002',
                meter_id: 'MTR002',
                transaction_type: 'IMPORT',
                energy_kwh: 200.0,
                amount_inr: 1300.00,
                rate_per_kwh: 6.5,
                billing_period: '2024-12',
                metadata: {
                    reference_number: 'EB2024120002',
                    transformer_id: 'TRF001'
                }
            },
            {
                transaction_id: 'TXN003',
                user_id: 'USER003',
                meter_id: 'MTR003',
                transaction_type: 'IMPORT',
                energy_kwh: 175.25,
                amount_inr: 1139.13,
                rate_per_kwh: 6.5,
                billing_period: '2024-12',
                metadata: {
                    reference_number: 'EB2024120003',
                    transformer_id: 'TRF001'
                }
            }
        ];

        await GovLedger.insertMany(testLedgerData);
        console.log('✅ Inserted', testLedgerData.length, 'EB bill records');

        // Create test offers
        const testOffers = [
            {
                offer_id: 'OFF1001',
                creator_id: 'USER001',
                transformer_id: 'TRF001',
                units: 50,
                token_per_unit: 3,
                total_tokens: 150,
                remaining_units: 50,
                status: 'open',
                buyers: []
            },
            {
                offer_id: 'OFF1002',
                creator_id: 'USER002',
                transformer_id: 'TRF001',
                units: 75,
                token_per_unit: 2.5,
                total_tokens: 187.5,
                remaining_units: 75,
                status: 'open',
                buyers: []
            },
            {
                offer_id: 'OFF1003',
                creator_id: 'USER003',
                transformer_id: 'TRF001',
                units: 100,
                token_per_unit: 2,
                total_tokens: 200,
                remaining_units: 100,
                status: 'open',
                buyers: []
            }
        ];

        await Offer.insertMany(testOffers);
        console.log('✅ Inserted', testOffers.length, 'test offers');

        console.log('\n✅ Database seeded successfully!');
        console.log('You can now:');
        console.log('1. View EB bills in Government Ledger');
        console.log('2. See offers in Trade page');
        console.log('3. Buy/Sell energy');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

seedData();
