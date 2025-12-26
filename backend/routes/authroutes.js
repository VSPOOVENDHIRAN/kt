const express = require("express");
const router = express.Router();

const authController = require("../controllers/authcontroller");
const userController = require("../controllers/usercontroller"); //  This is important
const authMiddleware = require("../middleware/auth");
// DEBUG: check types
console.log("authMiddleware:", typeof authMiddleware);
console.log("userController.getUserProfile:", typeof userController.getUserProfile);

// --------------------- ROUTES ---------------------
// Test endpoint
router.get("/test", (req, res) => {
    res.json({ success: true, message: "Auth routes working", timestamp: new Date() });
});

router.post("/check-device", authController.checkDevice);
router.post("/send-otp", (req, res, next) => {
    console.log('[ROUTE] /api/auth/send-otp called');
    console.log('[ROUTE] Method:', req.method);
    console.log('[ROUTE] Body:', req.body);
    next();
}, authController.sendOtp);
router.get("/profile", authMiddleware, userController.getUserProfile);
router.post("/change-password", authMiddleware, userController.changePassword);

router.post("/verify-otp", authController.verifyOtp);
router.post("/register", authController.registerUser);
router.post("/login", authController.login);

module.exports = router;
