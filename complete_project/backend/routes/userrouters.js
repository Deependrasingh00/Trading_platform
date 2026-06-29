const express = require("express");
const router = express.Router();
const { signupUser, loginUser, getUserProfile } = require("../controller/usercontroller");
const authMiddleware = require("../middleware/authmiddleware");

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getUserProfile);

module.exports = router;
