const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true },
    userName:  { type: String },
    mobile:    { type: String },
    amount:    { type: Number, required: true },
    status:    { type: String, enum: ["Pending", "Confirmed"], default: "Pending" },
    transactionId: { type: String },
    screenshotUrl: { type: String, default: "" },
    // Admin sets profit percentage for this deposit
    profitPercent: { type: Number, default: 0 },
    // Calculated profit amount
    profitAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Deposit || mongoose.model("Deposit", depositSchema);
