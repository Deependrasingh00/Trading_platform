const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    // FIX: userEmail se identify karo - unique hoti hai, bank holder name nahi
    userEmail: { type: String, required: true },
    user: { type: String }, // display name ke liye
    mobile: { type: String },
    account: { type: String },
    ifsc: { type: String },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    step: { type: Number, default: 0 },
    // Admin custom message for each step (optional)
    customMessage: { type: String, default: "" },
    // Timestamp when step 4 was approved (for 24hr countdown timer)
    step4CompletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Withdrawal || mongoose.model("Withdrawal", withdrawalSchema);
