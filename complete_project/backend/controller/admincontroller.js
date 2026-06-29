const Withdrawal = require("../models/Withdrawal");

exports.getAllRequests = async (req, res) => {
  const requests = await Withdrawal.find();
  res.json(requests);
};

exports.approveRequest = async (req, res) => {
  await Withdrawal.findByIdAndUpdate(req.params.id, { status: "Approved" });
  res.json({ message: "Request approved" });
};

exports.rejectRequest = async (req, res) => {
  await Withdrawal.findByIdAndUpdate(req.params.id, { status: "Rejected" });
  res.json({ message: "Request rejected" });
};
