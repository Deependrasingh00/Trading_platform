const express = require("express");
const router = express.Router();
const Withdrawal = require("../models/withdrawal");
const Settings = require("../models/settings");
const adminMiddleware = require("../middleware/adminmiddleware");

// GET all requests
router.get("/requests", adminMiddleware, async (req, res) => {
  try {
    const requests = await Withdrawal.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT approve → step+1
router.put("/approve/:id", adminMiddleware, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: "Not found" });
    withdrawal.status = "Approved";
    withdrawal.step = withdrawal.step + 1;
    // Step 4 complete hone par timestamp save karo (24hr timer ke liye)
    if (withdrawal.step === 4) {
      withdrawal.step4CompletedAt = new Date();
    }
    await withdrawal.save();
    res.json({ message: "Approved", step: withdrawal.step, withdrawal });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT reject
router.put("/reject/:id", adminMiddleware, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findByIdAndUpdate(
      req.params.id,
      { status: "Rejected" },
      { new: true }
    );
    if (!withdrawal) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Rejected", withdrawal });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT custom message → admin sends message to user for any step
router.put("/message/:id", adminMiddleware, async (req, res) => {
  try {
    const { customMessage } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: "Not found" });
    withdrawal.customMessage = customMessage || "";
    await withdrawal.save();
    res.json({ message: "Message sent", withdrawal });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET settings (Public)
router.get("/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: "deposit_settings" });
    if (!settings) {
      settings = new Settings({
        key: "deposit_settings",
        upiId: "cryptox@upi",
        qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=cryptox@upi"
      });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT settings (Admin only)
router.put("/settings", adminMiddleware, async (req, res) => {
  try {
    const { upiId, qrCodeUrl, maintenanceMode, announcementBanner } = req.body;
    let settings = await Settings.findOne({ key: "deposit_settings" });
    if (!settings) {
      settings = new Settings({ key: "deposit_settings" });
    }
    if (upiId !== undefined) settings.upiId = upiId;
    if (qrCodeUrl !== undefined) settings.qrCodeUrl = qrCodeUrl;
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (announcementBanner !== undefined) settings.announcementBanner = announcementBanner;
    await settings.save();
    res.json({ message: "Settings updated successfully", settings });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET all registered users with their stats (Admin only)
router.get("/users", adminMiddleware, async (req, res) => {
  try {
    const User = require("../models/user");
    const Deposit = require("../models/deposit");
    const Withdrawal = require("../models/withdrawal");

    const users = await User.find().select("-password");
    const userList = await Promise.all(users.map(async (u) => {
      const deps = await Deposit.find({ userEmail: u.email });
      const totalDeposited = deps.reduce((sum, d) => sum + d.amount, 0);
      const totalProfit = deps.filter(d => d.status === "Confirmed").reduce((sum, d) => sum + (d.profitAmount || 0), 0);
      
      const withdrawals = await Withdrawal.find({ userEmail: u.email });
      const totalWithdrawn = withdrawals.filter(w => w.status === "Approved" && w.step === 4).reduce((sum, w) => sum + w.amount, 0);

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        isSuspended: u.isSuspended || false,
        totalDeposited,
        totalProfit,
        totalWithdrawn,
        createdAt: u.createdAt || (u._id && typeof u._id.getTimestamp === "function" ? u._id.getTimestamp() : null)
      };
    }));
    res.json(userList);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT update user suspension status (Admin only)
router.put("/users/status/:id", adminMiddleware, async (req, res) => {
  try {
    const User = require("../models/user");
    const { isSuspended } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isSuspended }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User status updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE - Clear all processed requests (Approved step 4 or Rejected) (Admin only)
router.delete("/requests/clear-processed", adminMiddleware, async (req, res) => {
  try {
    const result = await Withdrawal.deleteMany({
      $or: [
        { status: "Rejected" },
        { status: "Approved", step: 4 }
      ]
    });
    res.json({ message: "Processed requests cleared successfully", count: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE - Delete a specific processed request by ID (Admin only)
router.delete("/requests/:id", adminMiddleware, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: "Request not found" });

    // Verify it is a processed request
    if (withdrawal.status !== "Rejected" && !(withdrawal.status === "Approved" && withdrawal.step === 4)) {
      return res.status(400).json({ message: "Only completed or rejected requests can be deleted" });
    }

    await Withdrawal.findByIdAndDelete(req.params.id);
    res.json({ message: "Request deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;

