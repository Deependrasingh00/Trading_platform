const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "deposit_settings" },
    upiId: { type: String, default: "cryptox@upi" },
    qrCodeUrl: { type: String, default: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=cryptox@upi" },
    maintenanceMode: { type: Boolean, default: false },
    announcementBanner: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
