const User = require("../models/user");
const Device = require("../models/device"); // assuming you have device collection
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("../utils/sendotp");

const OTP_STORE = {}; // temporary in-memory OTP store { phone: { otp, expires } }

const authController = {
  // Step 1: Check device by phone
  async checkDevice(req, res) {
    try {
      const { phone } = req.body;
      if (!phone) return res.status(400).json({ success: false, message: "Phone required" });

      const device = await Device.findOne({ phone });
      if (!device)
        {  
          console.log("Device not registered for phone:", phone);
           return res.status(404).json({ success: false, message: "Device not registered" });

        }
        console.log("Device found for phone:", phone);

      res.json({ success: true, meter_id: device.meter_id, gridid: device.grid_id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // Step 2: Send OTP
  async sendOtp(req, res) {
    try {
      const { phone } = req.body;
      if (!phone) return res.status(400).json({ success: false, message: "Phone required" });

      const otp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
      const expires = Date.now() + 5 * 60 * 1000; // 5 min expiry
      OTP_STORE[phone] = { otp, expires };

      await sendOTP(phone, otp); // implement SMS in utils/sendotp.js
      res.json({ success: true, message: "OTP sent" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // Step 3: Verify OTPkdjfkdmdkscmcmsdsdcsdc
  async verifyOtp(req, res) {
    try {
      const { phone, otp } = req.body;
      if (!phone || !otp) return res.status(400).json({ success: false, message: "Phone and OTP required" });

      const record = OTP_STORE[phone];
      if (!record) return res.status(400).json({ success: false, message: "OTP not sent" });
      if (record.expires < Date.now()) return res.status(400).json({ success: false, message: "OTP expired" });
      if (record.otp != otp) return res.status(400).json({ success: false, message: "Invalid OTP" });

      delete OTP_STORE[phone];
      console.log("OTP verified for phone:", phone);
      res.json({ success: true, message: "OTP verified" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // Step 4: Register
  async registerUser(req, res) {
    try {
      const { name, email, password, phone } = req.body;

      // 1️⃣ Check if device exists
      const device = await Device.findOne({ phone });
      if (!device) {
        return res.status(400).json({ error: "Device not registered" });
      }

      if(device.status=="inactive")
      {
        return res.status(400).json({ error: "Device is in activate" });
      }
       console.log("Device found for registration:", device.meter_id);
     // 2️⃣ Check if email already exists
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ error: "Email is already registered" });
      }
      console.log("Email not registered:", email);

      // 3️⃣ Check if meter_id already assigned
      const meterAssigned = await User.findOne({ meter_id: device.meter_id });
      if (meterAssigned) {
        return res.status(400).json({ error: "Device already linked to another user" });
      }
       console.log("Meter ID not linked, proceeding with registration:", device.meter_id);

      // 3️⃣ Generate user_id
      const lastUser = await User.findOne().sort({ created_at: -1 });
      const lastNumber = lastUser ? parseInt(lastUser.user_id.replace("USR", "")) : 1000;
      const user_id = "USR" + (lastNumber + 1);

      // 4️⃣ Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 5️⃣ Save user
      const newUser = new User({
        user_id,
        name,
        email,
        password: hashedPassword,
        phone,
        meter_id: device.meter_id,
        transformer_id: device.transformer_id ,
        grid_id: device.grid_id,
        wallet_balance: 0,
        energy_balance:0, 
        token_balance: 0,
        reserved_energy:0, // locked for sell offers
        reserved_tokens: 0,  
        total_energy_sold:0,            // P2P sold (kWh)
        total_energy_bought:0 ,          // P2P bought (kWh)
        total_imported_energy:0 ,          // From meter
        total_exported_energy: 0,
        last_import_reading: 0 ,          // Highest meter reading
        last_export_reading:  0 ,
        last_login: new Date(),
        created_at: new Date()
      });

      await newUser.save();
      console.log("User registered successfully:", newUser.user_id);

      res.status(201).json({
        message: "User registered successfully",
        user: {
          user_id: newUser.user_id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          meter_id: newUser.meter_id,
          grid_id: newUser.grid_id
        }
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Step 5: Login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });
      
      console.log("Login attempt for email:", email);
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ success: false, message: "Invalid password" });

      user.last_login = new Date();
      await user.save();

      const token = jwt.sign({ user_id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      console.log("Login successful for user:", token);
      res.json({ success: true, user, token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
};

module.exports = authController;
