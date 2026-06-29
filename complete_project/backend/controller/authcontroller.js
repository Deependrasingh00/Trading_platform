const Admin = require("../models/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.signupAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const existing = await Admin.findOne({ username });
    if (existing) return res.status(400).json({ message: "Admin already exists" });
    const admin = new Admin({ username, password });
    await admin.save();
    res.json({ message: "Admin created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error creating admin" });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Use same JWT_SECRET as authmiddleware
    const token = jwt.sign(
      { role: "admin", id: admin._id },
      process.env.JWT_SECRET || "supersecretkey123",
      { expiresIn: "8h" }
    );
    res.json({ token, admin: { id: admin._id, username: admin.username } });
  } catch (err) {
    res.status(500).json({ message: "Error logging in" });
  }
};
