const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Admin = require("./models/admin");

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/cryptoDB")
  .then(async () => {
    console.log("✅ MongoDB connected for seeding");
    try {
      const existing = await Admin.findOne({ username: "admin" });
      if (existing) {
        console.log("Admin already exists in DB");
      } else {
        const admin = new Admin({ username: "admin", password: "admin123" });
        await admin.save();
        console.log("Admin successfully seeded: admin / admin123");
      }
    } catch (e) {
      console.error("Error seeding admin:", e);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
