const express = require("express");
const router = express.Router();
const Deposit = require("../models/deposit");
const adminMiddleware = require("../middleware/adminmiddleware");

// POST - User submits a deposit
router.post("/", async (req, res) => {
  try {
    const { userEmail, userName, mobile, amount, transactionId } = req.body;
    if (!userEmail || !amount) {
      return res.status(400).json({ message: "userEmail and amount are required" });
    }
    const deposit = new Deposit({ userEmail, userName, mobile, amount, transactionId });
    await deposit.save();
    res.json({ message: "Deposit submitted successfully", deposit });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET - User fetches their deposits
router.get("/user/:userEmail", async (req, res) => {
  try {
    const deposits = await Deposit.find({ userEmail: req.params.userEmail }).sort({ createdAt: -1 });
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET - Admin fetches all deposits
router.get("/admin/all", adminMiddleware, async (req, res) => {
  try {
    const deposits = await Deposit.find().sort({ createdAt: -1 });
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT - Admin confirms deposit and sets profit amount
router.put("/admin/confirm/:id", adminMiddleware, async (req, res) => {
  try {
    const { profitAmount } = req.body;
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: "Deposit not found" });

    deposit.status = "Confirmed";
    deposit.profitAmount = Number(profitAmount) || 0;
    deposit.profitPercent = deposit.amount > 0 ? (deposit.profitAmount / deposit.amount) * 100 : 0;
    await deposit.save();
    res.json({ message: "Deposit confirmed", deposit });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT - Admin updates profit amount on an existing deposit
router.put("/admin/set-profit/:id", adminMiddleware, async (req, res) => {
  try {
    const { profitAmount } = req.body;
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: "Deposit not found" });

    deposit.profitAmount = Number(profitAmount) || 0;
    deposit.profitPercent = deposit.amount > 0 ? (deposit.profitAmount / deposit.amount) * 100 : 0;
    await deposit.save();
    res.json({ message: "Profit updated", deposit });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
