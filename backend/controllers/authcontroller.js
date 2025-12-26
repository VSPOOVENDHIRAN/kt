const User = require("../models/user");
const Device = require("../models/device"); 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const OTP_STORE = {}; 

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
        sendOtp (phone);

      res.json({ success: true, meter_id: device.meter_id, gridid: device.grid_id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // Step 2: Send OTP
  
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
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ error: "Email is already registered" });
      }
      console.log("Email not registered:", email);

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


      const hashedPassword = await bcrypt.hash(password, 10);

      // 5️ Save user
      const newUser = new User({
        user_id,
        name,
        email,
        password: hashedPassword,
        phone,
        meter_id: device.meter_id,
        transformer_id: device.transformer_id ,
        grid_id: device.grid_id,
       // wallet_address: "", // to be set later
        energy_balance:0, 
        reserved_energy:0, // locked for sell offers
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


  async send_Otp (req, res ) {
    try {
     const { phone } = req.body;
    // const { phone } = req.body;
      console.log("Sending OTP to phone:", phone);
      if (!phone) return res.status(400).json({ success: false, message: "Phone required" });
     // console.log("Sending OTP to phone:", phone);

      const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
      const expires = Date.now() + 5 * 60 * 1000; // 5 min expiry
      OTP_STORE[phone] = { otp, expires };
      
         console.log(`Sending OTP ${otp} to phone ${phone}`);
         res.json({ success: true, message: "OTP sent successfully" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
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
      
      console.log("pasword",bcrypt.hashSync(password, 10));
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