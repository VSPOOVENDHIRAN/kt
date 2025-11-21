// 1. Import the necessary Mongoose Model
// The path goes up one directory (../) from 'services' into 'models'.
const User = require("../models/user"); 

/**
 * Finds a user in the database based on their associated meter ID.
 * This function is used by the reading controller to link incoming meter data to a user account.
 * * @param {string} meterId - The unique ID of the smart meter that sent the reading.
 * @returns {Promise<Object|null>} - The user document if found, or null if no user is linked.
 */
async function findUserByMeterId(meterId) {
    try {
        // Query the MongoDB collection for one user document matching the meter_id
        const user = await User.findOne({ meter_id: meterId }).exec();

        if (!user) {
            console.log("❌ User NOT found for meter:", meterId);
            return null;
        }

        console.log("✅ User found:", user._id);
        return user;

    } catch (err) {
        // Handle potential database errors (e.g., connection issues)
        console.error("Error finding user:", err);
        return null;
    }
}

// 2. Export the function so other modules (like readingcontroller.js) can use it
module.exports = {
    findUserByMeterId
};