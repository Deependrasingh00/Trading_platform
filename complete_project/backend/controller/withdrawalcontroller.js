const Withdrawal = require("../models/withdrawal");

// User: naya withdrawal request banao
exports.createWithdrawal = async (req, res) => {
  try {
    const { userEmail, user, mobile, account, ifsc, amount, step, status } = req.body;

    if (!userEmail) {
      return res.status(400).json({ message: "userEmail is required" });
    }

    const newReq = new Withdrawal({
      userEmail,
      user,
      mobile,
      account,
      ifsc,
      amount,
      step: step ?? 0,
      status: status ?? "Pending",
    });

    await newReq.save();
    res.json({ message: "Withdrawal request created", request: newReq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// FIX: email se fetch karo - unique identifier
exports.getUserWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({
      userEmail: req.params.userEmail,
    }).sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Admin: saare requests
exports.getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Admin: approve → step+1
exports.approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: "Not found" });

    withdrawal.status = "Approved";
    withdrawal.step = withdrawal.step + 1;
    await withdrawal.save();

    res.json({ message: `Approved! Step is now ${withdrawal.step}`, withdrawal });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Admin: reject
exports.rejectWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: "Not found" });

    withdrawal.status = "Rejected";
    await withdrawal.save();
    res.json({ message: "Rejected", withdrawal });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
