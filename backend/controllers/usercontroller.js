const User = require("../models/user");

const usercontroller = {
  // Find user by meter_id
  findUserByMeterId: async (meterId) => {
    if (!meterId) throw new Error("Meter ID is required");

    try {
      const user = await User.findOne({ meter_id: meterId }).exec();

      if (!user) {
        console.log(`❌ User NOT found for meter: ${meterId}`);
        return null;
      }

      console.log(`✅ User found: ${user._id}`);
      return user;

    } catch (err) {
      console.error("Error finding user:", err);
      return null;
    }
  }
};

module.exports = usercontroller;
