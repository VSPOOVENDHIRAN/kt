const User = require("../models/user"); 


async function findUserByMeterId(meterId) {
    try {
        // Query the MongoDB collection for one user document matching the meter_id
        const user = await User.findOne({ meter_id: meterId }).exec();

        if (!user) {
            console.log(" User NOT found for meter:", meterId);
            return null;
        }

        console.log("User found:", user.name);
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