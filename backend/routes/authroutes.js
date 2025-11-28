const express = require("express");
const router = express.Router();

const authController = require("../controllers/authcontroller");
const userController = require("../controllers/usercontroller"); // ✅ This is important
const authMiddleware = require("../middleware/auth");
// DEBUG: check types
console.log("authMiddleware:", typeof authMiddleware);
console.log("userController.getUserProfile:", typeof userController.getUserProfile);

// --------------------- ROUTES ---------------------
router.post("/check-device", authController.checkDevice);
router.post("/send-otp", authController.sendOtp);
router.get("/profile", authMiddleware, userController.getUserProfile);
router.post("/change-password", authMiddleware, userController.changePassword);

router.post("/verify-otp", authController.verifyOtp);
router.post("/register", authController.registerUser);
router.post("/login", authController.login);

module.exports = router;
