const express = require("express");
const router = express.Router();

const authController = require("../controllers/authcontroller");
const userController = require("../controllers/usercontroller");

// JWT middleware
const auth = require("../middleware/auth");

// ------------------ AUTH ROUTES ------------------ //

// Step 1: Check if device exists for phone
router.post("/check-device", authController.checkDevice);

// Step 2: Send OTP
router.post("/send-otp", authController.sendOtp);

// Step 3: Verify OTP
router.post("/verify-otp", authController.verifyOtp);

// Step 4: Register user
router.post("/register", authController.registerUser);

// Step 5: Login user
router.post("/login", authController.login);



// ------------------ PROTECTED ROUTES ------------------ //

// Example: Get logged-in user profile
router.get("/profile", auth, async (req, res) => {
    try {
        const user = await userController.getProfile(req.user.user_id);
        res.json({ success: true, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


// Example: Update user profile (protected)
router.put("/update-profile", auth, userController.updateProfile);


module.exports = router;
