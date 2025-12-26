const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");

const authController = require("../controllers/authcontroller");
const userController = require("../controllers/usercontroller");

router.post("/check-device", authController.checkDevice);
router.get("/profile", authMiddleware, userController.getUserProfile);
router.post("/change-password", authMiddleware, userController.changePassword);

router.post("/verify-otp", authController.verifyOtp);
router.post("/register", authController.registerUser);
router.post("/login", authController.login);

module.exports = router;
