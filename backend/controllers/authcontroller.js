const User = require("../models/user");
const Device = require("../models/device"); // assuming you have device collection
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
<<<<<<< HEAD
const { sendOTP, verifyOTP } = require("../utils/sendotp");
=======
//const { sendOTP } = require("../utils/sendotp");
>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874

const OTP_STORE = {}; // Backup for development mode only

const authController = {
  // Step 1: Check device by phone
  async checkDevice(req, res) {
    try {
      const { phone } = req.body;
      if (!phone) return res.status(400).json({ success: false, message: "Phone required" });

      const device = await Device.findOne({ phone });
      if (!device) {
        console.log("Device not registered for phone:", phone);
        return res.status(404).json({ success: false, message: "Device not registered" });

<<<<<<< HEAD
      }
      console.log("Device found for phone:", phone);
=======
        }
        console.log("Device found for phone:", phone);
        sendOtp (phone);
>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874

      res.json({ success: true, meter_id: device.meter_id, gridid: device.grid_id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

<<<<<<< HEAD
  // Step 2: Send OTP using Twilio Verify API
  async sendOtp(req, res) {
    try {
      const { phone } = req.body;
      if (!phone) return res.status(400).json({ success: false, message: "Phone required" });

      // Validate phone format
      if (!phone.startsWith('+')) {
        return res.status(400).json({
          success: false,
          message: "Phone number must include country code (e.g., +1234567890)"
        });
      }

      // Send OTP via Twilio Verify (OTP generation handled by Twilio)
      const result = await sendOTP(phone);

      if (result.success) {
        console.log(`✓ OTP sent successfully for ${phone}`);
        res.json({
          success: true,
          message: result.message || "OTP sent successfully"
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || "Failed to send OTP"
        });
      }
    } catch (err) {
      console.error('❌ Send OTP error:', err);
      res.status(500).json({
        success: false,
        message: err.message || "Failed to send OTP"
      });
    }
  },
=======
  // Step 2: Send OTP
  
>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874

  // Step 3: Verify OTP using Twilio Verify API
  async verifyOtp(req, res) {
    try {
      const { phone, otp } = req.body;
      if (!phone || !otp) {
        return res.status(400).json({
          success: false,
          message: "Phone and OTP required"
        });
      }

      // Verify OTP via Twilio Verify API
      const result = await verifyOTP(phone, otp.toString());

      if (result.success) {
        console.log(`✓ OTP verified successfully for ${phone}`);
        res.json({
          success: true,
          message: result.message || "OTP verified successfully"
        });
      } else {
        console.log(`❌ OTP verification failed for ${phone}: ${result.message}`);
        res.status(400).json({
          success: false,
          message: result.message || "Invalid or expired OTP"
        });
      }
    } catch (err) {
      console.error('❌ Verify OTP error:', err);
      res.status(500).json({
        success: false,
        message: "Server error during OTP verification"
      });
    }
  },

  // Step 4: Register
  async registerUser(req, res) {
    try {
      const { name, email, password, phone } = req.body;

<<<<<<< HEAD
      // 1️⃣ Check if email already exists
=======
      // 1 Check if device exists
      const device = await Device.findOne({ phone });

      if (!device) {
        return res.status(400).json({ error: "Device not registered" });
      }

      if(device.status=="inactive")
      {
        return res.status(400).json({ error: "Device is in activate" });
      }
       console.log("Device found for registration:", device.meter_id);
     // 2 Check if email already exists
>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ error: "Email is already registered" });
      }
      console.log("Email not registered:", email);

<<<<<<< HEAD
      // 2️⃣ Check if phone already exists
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ error: "Phone number is already registered" });
      }
      console.log("Phone not registered:", phone);

      // 3️⃣ Check if device exists (optional - for linking if available)
      const device = await Device.findOne({ phone });
      let meter_id = null;
      let transformer_id = null;
      let grid_id = null;

      if (device) {
        // Device exists - validate it's not already linked
        if (device.status === "inactive") {
          return res.status(400).json({ error: "Device is inactive" });
        }

        const meterAssigned = await User.findOne({ meter_id: device.meter_id });
        if (meterAssigned) {
          return res.status(400).json({ error: "Device already linked to another user" });
        }

        // Use device info
        meter_id = device.meter_id;
        transformer_id = device.transformer_id;
        grid_id = device.grid_id;
        console.log("Device found and will be linked:", meter_id);
      } else {
        // No device - create account without device linking
        console.log("No device found for phone, creating account without device linking");
        meter_id = "PENDING_" + phone; // Temporary meter_id
        transformer_id = "PENDING";
        grid_id = "PENDING";
      }

      // 4️⃣ Generate user_id
      const lastUser = await User.findOne().sort({ created_at: -1 });
      const lastNumber = lastUser ? parseInt(lastUser.user_id.replace("USR", "")) : 1000;
      const user_id = "USR" + (lastNumber + 1);
=======
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ error: "Phone is already registered" });
      }
        console.log("Phone not registered:", phone);

      // 3️ Check if meter_id already assigned
      const meterAssigned = await User.findOne({ meter_id: device.meter_id });

      if (meterAssigned) {
        return res.status(400).json({ error: "Device already linked to another user" });
      }
       console.log("Meter ID not linked, proceeding with registration:", device.meter_id);
const lastUser = await User.findOne({ user_id: /^USR\d+$/ })
  .sort({ created_at: -1 });

let lastNumber = 1000;

if (lastUser && lastUser.user_id) {
  const match = lastUser.user_id.match(/^USR(\d+)$/);
  if (match) {
    lastNumber = Number(match[1]);
  }
}

const user_id = `USR${lastNumber + 1}`;

>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874

      // 5️⃣ Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 6️⃣ Save user
      const newUser = new User({
        user_id,
        name,
        email,
        password: hashedPassword,
        phone,
<<<<<<< HEAD
        meter_id: meter_id,
        transformer_id: transformer_id,
        grid_id: grid_id,
        wallet_balance: 0,
        energy_balance: 0,
        token_balance: 0,
        reserved_energy: 0,
        reserved_tokens: 0,
        total_energy_sold: 0,
        total_energy_bought: 0,
        total_imported_energy: 0,
=======
        meter_id: device.meter_id,
        transformer_id: device.transformer_id ,
        grid_id: device.grid_id,
       // wallet_address: "", // to be set later
        energy_balance:0, 
        reserved_energy:0, // locked for sell offers
        total_energy_sold:0,            // P2P sold (kWh)
        total_energy_bought:0 ,          // P2P bought (kWh)
        total_imported_energy:0 ,          // From meter
>>>>>>> 972f4a3dc4952ab6cb7ba289b595ad5352207874
        total_exported_energy: 0,
        last_import_reading: 0,
        last_export_reading: 0,
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
          grid_id: newUser.grid_id,
          device_linked: device ? true : false
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

      const token = jwt.sign({ user_id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
      console.log("Login successful for user:", token);
      res.json({ success: true, user, token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
};

const sendOtp = async(phone) => {
    try {
    //  const { phone } = req.body;
      if (!phone) return res.status(400).json({ success: false, message: "Phone required" });

      const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
      const expires = Date.now() + 5 * 60 * 1000; // 5 min expiry
      OTP_STORE[phone] = { otp, expires };

     // await sendOTP(phone, otp); // implement SMS in utils/sendotp.js

      
         console.log(`Sending OTP ${otp} to phone ${phone}`);

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

module.exports = authController;
