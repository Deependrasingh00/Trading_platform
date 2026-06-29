const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const withdrawalRoutes = require("./routes/withdrawalroutes");
const adminRoutes = require("./routes/adminroutes");
const authRoutes = require("./routes/authroutes");
const depositRoutes = require("./routes/depositroutes");

const app = express();
const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"].filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    // Allow same-origin, localhost dev, explicitly allowed frontend, or any origin in production deployment
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === "production") {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  }
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/deposits", depositRoutes);

// Serve static files from the React frontend build
app.use(express.static(path.join(__dirname, "../vite-project/dist")));

// Anything that doesn't match an API route should serve the index.html from the build folder
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../vite-project/dist/index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

