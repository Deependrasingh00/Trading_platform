const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// ✅ Signup
exports.signupUser = async (req, res) => {
  try {
    const { name, email, password, phone, country } = req.body;
    if (!name || !email || !password || !phone || !country) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    // Generate random 6-digit OTP (fallback to "123456" if SMTP is not configured)
    const isSmtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
    const otp = isSmtpConfigured
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : "123456";
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    const user = new User({ name, email, password, phone, country, otp, otpExpires, isVerified: false });
    await user.save();

    // Log the OTP clearly in server console
    console.log(`\n========================================`);
    console.log(`🔑 Verification OTP for ${email}: ${otp}`);
    console.log(`========================================\n`);

    // Attempt sending email if SMTP configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        await transporter.sendMail({
          from: `"CryptoX Security" <${process.env.SMTP_USER}>`,
          to: email,
          subject: "Confirm your CryptoX Registration - OTP Code",
          text: `Hello ${name},\n\nYour 6-digit OTP code to verify your account is: ${otp}.\nThis code expires in 10 minutes.\n\nBest regards,\nCryptoX Security Team`,
          html: `<p>Hello <b>${name}</b>,</p><p>Your 6-digit OTP code to verify your account is: <h2 style="color: #22d3ee; font-size: 28px; letter-spacing: 2px;">${otp}</h2></p><p>This code expires in 10 minutes.</p><br/><p>Best regards,<br/>CryptoX Security Team</p>`,
        });
        console.log(`📧 OTP Email successfully sent to ${email}`);
      } catch (emailErr) {
        console.error("❌ Failed to send email via SMTP, printed to log instead:", emailErr.message);
      }
    }

    res.json({ message: "User registered. Please verify your OTP code.", requiresVerification: true, email });
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

    // Block login and request OTP verification if not verified
    if (!user.isVerified) {
      // Regenerate OTP (fallback to "123456" if SMTP is not configured)
      const isSmtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
      const otp = isSmtpConfigured
        ? Math.floor(100000 + Math.random() * 900000).toString()
        : "123456";
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();

      console.log(`\n========================================`);
      console.log(`🔑 Verification OTP for ${email}: ${otp}`);
      console.log(`========================================\n`);

      // Attempt to resend
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          });
          await transporter.sendMail({
            from: `"CryptoX Security" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "CryptoX OTP Verification Code",
            text: `Your verification OTP is: ${otp}`,
            html: `<h3>Your verification OTP is: ${otp}</h3>`
          });
        } catch (e) {
          console.error("Email send failed:", e.message);
        }
      }

      return res.status(403).json({ 
        message: "Your email is not verified. An OTP has been sent to your email.", 
        requiresVerification: true, 
        email 
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ✅ Verify OTP
exports.verifyOtpUser = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user, message: "Email verified successfully!" });
  } catch (err) {
    console.error("OTP Verification error:", err);
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
