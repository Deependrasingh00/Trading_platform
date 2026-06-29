const express = require("express");
const router = express.Router();
const { signupUser, loginUser, getUserProfile, resetUserPassword, getUserStatus } = require("../controller/usercontroller");
const { signupAdmin, loginAdmin } = require("../controller/authcontroller");
const authMiddleware = require("../middleware/authmiddleware");

// User routes
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/forgot-password", resetUserPassword);
router.get("/status/:email", getUserStatus);
router.get("/me", authMiddleware, getUserProfile);

// Admin auth routes - Adminlogin.jsx calls /api/auth/admin/login
router.post("/admin/signup", signupAdmin);
router.post("/admin/login", loginAdmin);

module.exports = router;
