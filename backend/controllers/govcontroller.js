const GovLedger = require("../models/govledger");
const User = require("../models/user");

// Get all EB bill data for government verification
exports.getAllEBBills = async (req, res) => {
    try {
        const { user_id } = req.query;

        let query = {};
        if (user_id) {
            query.user_id = user_id;
        }

        const ledgerData = await GovLedger.find(query)
            .sort({ timestamp: -1 })
            .limit(1000);

        // Group by user_id and calculate totals
        const userBills = {};

        for (const record of ledgerData) {
            if (!userBills[record.user_id]) {
                const user = await User.findOne({ user_id: record.user_id });
                userBills[record.user_id] = {
                    user_id: record.user_id,
                    meter_id: record.meter_id,
                    eb_bill_number: record.metadata?.reference_number || "N/A",
                    total_units: 0,
                    total_amount: 0,
                    transactions: []
                };
            }

            userBills[record.user_id].total_units += record.energy_kwh || 0;
            userBills[record.user_id].total_amount += record.amount_inr || 0;
            userBills[record.user_id].transactions.push({
                transaction_id: record.transaction_id,
                type: record.transaction_type,
                energy_kwh: record.energy_kwh,
                amount_inr: record.amount_inr,
                timestamp: record.timestamp
            });
        }

        const billsArray = Object.values(userBills);

        return res.json({
            success: true,
            count: billsArray.length,
            data: billsArray
        });
    } catch (err) {
        console.error("getAllEBBills error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get EB bill for specific user
exports.getUserEBBill = async (req, res) => {
    try {
        const { user_id } = req.params;

        const ledgerData = await GovLedger.find({ user_id })
            .sort({ timestamp: -1 });

        if (!ledgerData || ledgerData.length === 0) {
            return res.json({
                success: true,
                data: {
                    user_id,
                    total_units: 0,
                    total_amount: 0,
                    transactions: []
                }
            });
        }

        const user = await User.findOne({ user_id });

        let total_units = 0;
        let total_amount = 0;
        const transactions = [];

        for (const record of ledgerData) {
            total_units += record.energy_kwh || 0;
            total_amount += record.amount_inr || 0;
            transactions.push({
                transaction_id: record.transaction_id,
                type: record.transaction_type,
                energy_kwh: record.energy_kwh,
                amount_inr: record.amount_inr,
                timestamp: record.timestamp
            });
        }

        return res.json({
            success: true,
            data: {
                user_id,
                meter_id: ledgerData[0].meter_id,
                eb_bill_number: ledgerData[0].metadata?.reference_number || "N/A",
                total_units,
                total_amount,
                transactions
            }
        });
    } catch (err) {
        console.error("getUserEBBill error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get government ledger data (for frontend Gov Ledger page)
exports.getGovLedger = async (req, res) => {
    try {
        const { search } = req.query;

        let query = {};
        if (search) {
            query.user_id = { $regex: search, $options: 'i' };
        }

        const ledgerData = await GovLedger.find(query)
            .sort({ timestamp: -1 });

        // Group by user_id and calculate monthly totals
        const userMap = {};

        for (const record of ledgerData) {
            if (!userMap[record.user_id]) {
                userMap[record.user_id] = {
                    user_id: record.user_id,
                    monthly_units: 0,
                    monthly_bill: 0
                };
            }

            userMap[record.user_id].monthly_units += record.energy_kwh || 0;
            userMap[record.user_id].monthly_bill += record.amount_inr || 0;
        }

        const users = Object.values(userMap);

        return res.json({
            success: true,
            data: {
                total_users: users.length,
                users: users
            }
        });
    } catch (err) {
        console.error("getGovLedger error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
