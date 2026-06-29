const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/user");

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/cryptoDB")
  .then(async () => {
    console.log("✅ MongoDB connected for seeding user");
    try {
      const existing = await User.findOne({ email: "demo@demo.com" });
      if (existing) {
        console.log("User demo@demo.com already exists in DB");
      } else {
        const user = new User({ name: "Demo User", email: "demo@demo.com", password: "demo123" });
        await user.save();
        console.log("User successfully seeded: demo@demo.com / demo123");
      }
    } catch (e) {
      console.error("Error seeding user:", e);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
