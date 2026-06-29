const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// ✅ Signup
exports.signupUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const user = new User({ name, email, password });
    await user.save();
    res.json({ message: "User created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ✅ Login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isSuspended) return res.status(403).json({ message: "Your account is suspended. Please contact support." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ✅ Profile
exports.getUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
};

// ✅ Reset Password (Forgot Password)
exports.resetUserPassword = async (req, res) => {
  try {
    const { name, email, newPassword } = req.body;
    if (!name || !email || !newPassword) {
      return res.status(400).json({ message: "Name, email, and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify name matches (case-insensitive)
    if (user.name.toLowerCase() !== name.toLowerCase()) {
      return res.status(400).json({ message: "Name and email do not match our records" });
    }

    // Set new password (pre-save hook will automatically hash it)
    user.password = newPassword;
    await user.save();
    
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Get User Suspension Status
exports.getUserStatus = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.query.email || req.params.email });
    if (!user) return res.json({ isSuspended: false });
    res.json({ isSuspended: user.isSuspended || false });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
