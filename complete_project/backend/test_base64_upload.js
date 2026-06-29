const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const Settings = require("./models/settings");

dotenv.config();

const imagePath = "C:/Users/deepe/.gemini/antigravity-ide/brain/8271da63-ce22-41ad-925e-9c688719a8b4/double_click_test_type_1781680488202.png";

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/cryptoDB")
  .then(async () => {
    console.log("✅ MongoDB connected for mock upload");
    try {
      if (!fs.existsSync(imagePath)) {
        console.error("❌ Image file not found at path:", imagePath);
        process.exit(1);
      }
      
      const fileBuffer = fs.readFileSync(imagePath);
      const base64String = `data:image/png;base64,${fileBuffer.toString("base64")}`;
      
      let settings = await Settings.findOne({ key: "deposit_settings" });
      if (!settings) {
        settings = new Settings({ key: "deposit_settings" });
      }
      settings.upiId = "mockupi@okaxis";
      settings.qrCodeUrl = base64String;
      await settings.save();
      console.log("✅ Mock QR Image uploaded to database successfully as base64!");
    } catch (e) {
      console.error("❌ Error uploading mock QR:", e);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
