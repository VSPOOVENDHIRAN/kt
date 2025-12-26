const mongoose = require('mongoose');

const govLedgerSchema = new mongoose.Schema(
    {
        transaction_id: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        user_id: {
            type: String,
            required: true,
            index: true
        },
        meter_id: {
            type: String,
            required: true,
            index: true
        },
        transaction_type: {
            type: String,
            required: true,
            enum: ['IMPORT', 'EXPORT', 'BILL_PAYMENT', 'CREDIT', 'DEBIT', 'SUBSIDY', 'PENALTY']
        },
        energy_kwh: {
            type: Number,
            default: 0
        },
        amount_inr: {
            type: Number,
            required: true
        },
        rate_per_kwh: {
            type: Number,
            default: 0
        },
        billing_period: {
            type: String,
            default: ''
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        },
        status: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
            default: 'COMPLETED'
        },
        description: {
            type: String,
            default: ''
        },
        metadata: {
            grid_id: String,
            transformer_id: String,
            payment_method: String,
            reference_number: String
        }
    },
    {
        versionKey: false,
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

// Indexes for efficient querying
govLedgerSchema.index({ user_id: 1, timestamp: -1 });
govLedgerSchema.index({ meter_id: 1, timestamp: -1 });
govLedgerSchema.index({ transaction_type: 1, timestamp: -1 });

module.exports = mongoose.model('GovLedger', govLedgerSchema, 'gov_ledger');
