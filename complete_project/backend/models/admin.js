const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// ✅ Fix: async function without next
adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  try {
    this.password = await bcrypt.hash(this.password, 10);
  } catch (err) {
    throw err;
  }
});

module.exports = mongoose.model("Admin", adminSchema);
