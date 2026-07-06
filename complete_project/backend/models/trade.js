const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    coin: { type: String, required: true },
    type: { type: String, enum: ["buy", "sell"], default: "buy" },
    status: { type: String, enum: ["ongoing", "completed"], default: "ongoing" },
    profitAmount: { type: Number, default: 0 },
    acknowledged: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Trade || mongoose.model("Trade", tradeSchema);
