const User = require("../models/user");
const bcrypt = require("bcryptjs"); // needed for changePassword

const usercontroller = {

  // 1. Get user profile
  async getUserProfile (req, res) {
    try {
     
     const user = req.user; // password excluded in auth middleware
      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({ success: true, data: user });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  },

  // 2. Change password
  async changePassword (req, res) {
    try {
      console.log("Change password request received");
      console.log("Request body:", req.body);
      const { currentPassword, newPassword } = req.body;
      console.log("Current Password:", currentPassword ? "Provided" : "Not provided");
      const user =req.user;
      console.log("Changing password for user:", req.user.user_id);
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Current password incorrect" });
      console.log("Current password verified");
      const hashed = await bcrypt.hash(newPassword, 10);

      user.password = hashed;
      await user.save();

      res.json({ success: true, message: "Password updated successfully" });

    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },

  // 3. Get balances
  async getBalances (req, res) {
    try {
      const user = await User.findById(req.user.user_id)
        .select(
          "wallet_balance token_balance last_export_reading last_import_reading total_energy_sold total_energy_bought"
        );

      if (!user) return res.status(404).json({ message: "User not found" });

      const energy_balance =
        user.last_export_reading -
        user.last_import_reading -
        user.total_energy_sold +
        user.total_energy_bought;

      res.json({
        success: true,
        data: {
          wallet_balance: user.wallet_balance,
          token_balance: user.token_balance,
          energy_balance
        }
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // 4. Update balances
  async updateBalances (req, res) {
    try {
      const { wallet, tokens, energy } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          walletBalance: wallet,
          tokenBalance: tokens,
          energyBalance: energy
        },
        { new: true }
      ).select("walletBalance tokenBalance energyBalance");

      res.json({ success: true, data: user });

    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },

  // 5. Get technical info
  async getTechnicalInfo (req, res) {
    try {
      const user = await User.findById(req.user.id).select("meterId transformerId");

      res.json({
        success: true,
        data: {
          meterId: user.meterId,
          transformerId: user.transformerId
        }
      });

    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },

  // 6. Find user by meter ID
  async findUserByMeterId (meterId) {
    if (!meterId) throw new Error("Meter ID is required");

    try {
      const user = await User.findOne({ meter_id: meterId }).exec();

      if (!user) {
        console.log(`User NOT found for meter: ${meterId}`);
        return null;
      }

      console.log(`User found: ${user._id}`);
      return user;

    } catch (err) {
      console.error("Error finding user:", err);
      return null;
    }
  }

};

module.exports = usercontroller;
