const jwt = require("jsonwebtoken");
const User = require("../models/user");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Invalid token format" });

    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB using ID in token
    const user = await User.findById(decoded.user_id);
    if (!user)
      return res.status(401).json({ message: "User not found" });

    // Attach all required info to req.user
    req.user = {
      user_id: user._id,
      email: user.email,
      name: user.name,
      transformer_id: user.transformer_id,   // MUST BE HERE
      meter_number: user.meter_number,       // (optional)
      role: user.role                        // (if needed)
    };

    next();

  } catch (err) {
    console.error("Auth Error:", err);
    return res.status(401).json({ message: "Token is invalid or expired" });
  }
};
