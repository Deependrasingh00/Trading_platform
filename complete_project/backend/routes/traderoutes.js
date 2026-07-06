const express = require("express");
const router = express.Router();
const Trade = require("../models/trade");
const Deposit = require("../models/deposit");
const Withdrawal = require("../models/withdrawal");
const adminMiddleware = require("../middleware/adminmiddleware");

// Helper function to calculate user balance
async function calculateUserBalance(email) {
  // 1. Confirmed deposits
  const deposits = await Deposit.find({ userEmail: email, status: "Confirmed" });
  const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);

  // 2. Approved withdrawals
  const withdrawals = await Withdrawal.find({ userEmail: email });
  const totalWithdrawn = withdrawals
    .filter(w => w.status === "Approved" && w.step === 4)
    .reduce((sum, w) => sum + w.amount, 0);

  // 3. Trades
  const trades = await Trade.find({ userEmail: email });
  const totalOngoingTradesAmount = trades
    .filter(t => t.status === "ongoing")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalCompletedTradeProfits = trades
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + (t.profitAmount || 0), 0);

  return totalDeposited + totalCompletedTradeProfits - totalOngoingTradesAmount - totalWithdrawn;
}

// POST - Create a new trade (User places a trade)
router.post("/", async (req, res) => {
  try {
    const { userEmail, amount, coin, type } = req.body;
    if (!userEmail || !amount || !coin) {
      return res.status(400).json({ message: "userEmail, amount, and coin are required" });
    }

    const tradeAmt = Number(amount);
    if (isNaN(tradeAmt) || tradeAmt <= 0) {
      return res.status(400).json({ message: "Invalid trade amount" });
    }

    // Calculate available balance
    const availableBalance = await calculateUserBalance(userEmail);
    if (tradeAmt > availableBalance) {
      return res.status(400).json({ message: `Insufficient balance! Available balance is ₹${availableBalance.toFixed(2)}` });
    }

    const trade = new Trade({
      userEmail,
      amount: tradeAmt,
      coin,
      type: type || "buy",
      status: "ongoing",
      profitAmount: 0,
      acknowledged: false
    });

    await trade.save();
    res.json({ message: "Trade started successfully", trade });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET - Get user trades
router.get("/user/:email", async (req, res) => {
  try {
    const trades = await Trade.find({ userEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET - Admin fetches all trades
router.get("/admin/all", adminMiddleware, async (req, res) => {
  try {
    const trades = await Trade.find().sort({ createdAt: -1 });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT - Admin sets profit on a trade and completes it
router.put("/admin/set-profit/:id", adminMiddleware, async (req, res) => {
  try {
    const { profitAmount } = req.body;
    const trade = await Trade.findById(req.params.id);
    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }

    trade.profitAmount = Number(profitAmount) || 0;
    trade.status = "completed";
    await trade.save();

    res.json({ message: "Trade profit updated and marked as completed", trade });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT - Acknowledge trade congratulations message
router.put("/acknowledge/:id", async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }
    trade.acknowledged = true;
    await trade.save();
    res.json({ message: "Trade profit message acknowledged", trade });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
