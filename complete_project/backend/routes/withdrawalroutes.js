const express = require("express");
const router = express.Router();
const {
  createWithdrawal,
  getUserWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} = require("../controller/withdrawalcontroller");

router.post("/", createWithdrawal);
// FIX: email se fetch karo
router.get("/user/:userEmail", getUserWithdrawals);
router.get("/admin/all", getAllWithdrawals);
router.patch("/admin/approve/:id", approveWithdrawal);
router.patch("/admin/reject/:id", rejectWithdrawal);

module.exports = router;
