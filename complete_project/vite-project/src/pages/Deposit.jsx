import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import axios from "axios";
import {
  FaWallet, FaRupeeSign, FaCheckCircle, FaClock, FaPhone,
  FaArrowRight, FaBitcoin, FaShieldAlt, FaLock, FaHistory,
} from "react-icons/fa";

export default function Deposit() {
  const [form, setForm] = useState({ amount: "", mobile: "", transactionId: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [deposits, setDeposits] = useState([]);
  const [trades, setTrades] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [screenshot, setScreenshot] = useState("");

  const [settings, setSettings] = useState({ upiId: "", qrCodeUrl: "" });
  const [copying, setCopying] = useState(false);

  const userEmail = localStorage.getItem("userEmail") || "";
  const userName = localStorage.getItem("userName") || "User";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showMsg("❌ Image size must be less than 5MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // Tone 1
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.15);

      // Tone 2
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.08); // A5
      gain2.gain.setValueAtTime(0.08, audioCtx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

      osc2.start(audioCtx.currentTime + 0.08);
      osc2.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.error("Audio failed to play:", e);
    }
  };

  const fetchHistory = async () => {
    if (!userEmail) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/deposits/user/${encodeURIComponent(userEmail)}`);
      setDeposits(prev => {
        if (prev && prev.length > 0) {
          const previouslyPending = prev.filter(d => d.status === "Pending");
          const newlyConfirmed = res.data.filter(d => d.status === "Confirmed");
          const gotApproved = newlyConfirmed.some(n => previouslyPending.some(p => p._id === n._id));
          if (gotApproved) {
            playNotificationSound();
            showMsg("🎉 Your deposit has been confirmed by the administrator!", "success");
          }
        }
        return res.data;
      });
    } catch (_) { }
    finally { setFetchingHistory(false); }
  };

  const fetchTrades = async () => {
    if (!userEmail) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/trades/user/${encodeURIComponent(userEmail)}`);
      setTrades(res.data);
    } catch (_) { }
  };

  const fetchWithdrawals = async () => {
    if (!userEmail) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/withdrawals/user/${encodeURIComponent(userEmail)}`);
      setWithdrawals(res.data);
    } catch (_) { }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/settings`);
      setSettings(res.data);
    } catch (_) { }
  };

  useEffect(() => {
    fetchHistory();
    fetchTrades();
    fetchWithdrawals();
    fetchSettings();
    const interval = setInterval(() => {
      fetchHistory();
      fetchTrades();
      fetchWithdrawals();
      fetchSettings();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      return showMsg("Please enter a valid amount", "error");
    }
    if (!form.transactionId || !form.transactionId.trim()) {
      return showMsg("Please enter Transaction Reference Number (UTR)", "error");
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/deposits`, {
        userEmail,
        userName,
        mobile: form.mobile,
        amount: Number(form.amount),
        transactionId: form.transactionId.trim(),
        screenshotUrl: screenshot,
      });
      showMsg("✅ Deposit request submitted successfully!", "success");
      setForm({ amount: "", mobile: "", transactionId: "" });
      setScreenshot("");
      fetchHistory();
    } catch (err) {
      showMsg(err.response?.data?.message || "❌ Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);
  const confirmedDeposits = deposits.filter(d => d.status === "Confirmed");
  const totalProfit = trades.filter(t => t.status === "completed").reduce((sum, t) => sum + (t.profitAmount || 0), 0);
  const totalWithdrawn = withdrawals.filter(w => w.status === "Approved" && w.step === 4).reduce((sum, w) => sum + w.amount, 0);
  const totalOngoingTradesAmount = trades.filter(t => t.status === "ongoing").reduce((sum, t) => sum + t.amount, 0);
  const availableBalance = totalDeposited + totalProfit - totalOngoingTradesAmount - totalWithdrawn;

  return (
    <div className="bg-[#020817] text-white min-h-screen">
      {/* Ambient blurs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-cyan-500/8 blur-[180px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/8 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-6">
            <FaWallet className="text-xs" />
            DEPOSIT FUNDS
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Add Funds to Your <span className="text-cyan-400">Account</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Deposit your amount securely. Once confirmed by admin, your investment will start earning profits.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Total Deposited", value: `₹${totalDeposited.toLocaleString("en-IN")}`, icon: FaRupeeSign, color: "cyan" },
            { label: "Available Balance", value: `₹${availableBalance.toLocaleString("en-IN")}`, icon: FaCheckCircle, color: "green" },
            { label: "Total Profit", value: `₹${totalProfit.toLocaleString("en-IN")}`, icon: FaShieldAlt, color: "yellow" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:border-cyan-500/20 transition-all duration-300">
              <div className={`w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 text-base shrink-0`}>
                <Icon />
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">{label}</p>
                <p className="font-bold text-lg text-cyan-400">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* Deposit Form & Payment QR */}
          <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 backdrop-blur-lg shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center">
                <FaBitcoin className="text-cyan-400 text-xl" />
              </div>
              <div>
                <h2 className="font-bold text-xl">New Deposit</h2>
                <p className="text-gray-500 text-xs">Scan & pay to complete deposit</p>
              </div>
            </div>

            {/* UPI / QR Code Payment Card */}
            <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-6 mb-6 flex flex-col items-center">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 font-semibold text-center">Scan QR Code or copy UPI to Pay</p>

              {settings.qrCodeUrl ? (
                <div className="bg-white p-3 rounded-xl shadow-lg mb-4 relative group transition-all duration-300 hover:scale-105">
                  <img src={settings.qrCodeUrl} alt="UPI QR Code" className="w-44 h-44 object-contain rounded-lg" />
                  <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                </div>
              ) : (
                <div className="w-44 h-44 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-4">
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <div className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono mt-2 overflow-hidden">
                <span className="text-gray-300 truncate mr-2 select-all">{settings.upiId || "Fetching UPI ID..."}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (settings.upiId) {
                      navigator.clipboard.writeText(settings.upiId);
                      setCopying(true);
                      setTimeout(() => setCopying(false), 2000);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${copying
                      ? "bg-green-500/20 text-green-400 border border-green-400/30"
                      : "bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-500/20"
                    }`}
                >
                  {copying ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Alert */}
            {msg.text && (
              <div className={`mb-6 p-4 rounded-2xl border text-sm font-semibold text-center ${msg.type === "success"
                  ? "bg-green-500/10 border-green-400/30 text-green-400"
                  : "bg-red-500/10 border-red-400/30 text-red-400"
                }`}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Amount */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider font-semibold">
                  Deposit Amount (₹)
                </label>
                <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-2xl px-5 py-4 transition-all">
                  <FaRupeeSign className="text-cyan-400 text-sm shrink-0" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="Enter amount e.g. 5000"
                    className="bg-transparent outline-none w-full ml-4 text-white placeholder-gray-600 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Quick amounts */}
              <div>
                <p className="text-xs text-gray-500 mb-3">Quick Select</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[1000, 5000, 10000, 25000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setForm({ ...form, amount: amt })}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${Number(form.amount) === amt
                          ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-400"
                          : "bg-white/5 border-white/10 text-gray-400 hover:border-cyan-400/30 hover:text-cyan-400"
                        }`}
                    >
                      ₹{amt.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider font-semibold">
                  Mobile Number
                </label>
                <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-2xl px-5 py-4 transition-all">
                  <FaPhone className="text-cyan-400 text-sm shrink-0" />
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={e => setForm({ ...form, mobile: e.target.value })}
                    placeholder="Enter mobile number"
                    className="bg-transparent outline-none w-full ml-4 text-white placeholder-gray-600 text-sm"
                  />
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider font-semibold">
                  UTR / Transaction ID
                </label>
                <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-2xl px-5 py-4 transition-all">
                  <FaShieldAlt className="text-cyan-400 text-sm shrink-0" />
                  <input
                    type="text"
                    value={form.transactionId}
                    onChange={e => setForm({ ...form, transactionId: e.target.value })}
                    placeholder="Enter 12-digit UTR / Ref ID"
                    className="bg-transparent outline-none w-full ml-4 text-white placeholder-gray-600 text-sm font-mono"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1 ml-1">Must match the exact transaction reference to authorize confirmation.</p>
              </div>

              {/* Payment Screenshot */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider font-semibold">
                  Payment Screenshot
                </label>
                <div className="flex flex-col gap-3 bg-[#0B1120] border border-white/10 rounded-2xl p-4 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-xs text-gray-400 file:bg-cyan-500/10 file:text-cyan-400 file:border-0 file:px-3 file:py-1.5 file:rounded-xl file:cursor-pointer file:font-semibold file:mr-3 hover:file:bg-cyan-500/20"
                  />
                  {screenshot && (
                    <div className="mt-1 relative w-24 h-24 rounded-xl overflow-hidden border border-white/20">
                      <img src={screenshot} alt="Screenshot Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setScreenshot("")}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center text-[10px] font-bold"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-cyan-500/20 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaLock className="text-sm" />
                    Submit Deposit
                    <FaArrowRight className="text-sm" />
                  </>
                )}
              </button>
            </form>

            {/* Info */}
            <div className="mt-6 p-4 bg-cyan-500/5 border border-cyan-400/15 rounded-2xl">
              <p className="text-xs text-cyan-300 leading-relaxed">
                🔒 Your deposit will be reviewed by the admin. Once confirmed, profits will be credited to your account automatically.
              </p>
            </div>
          </div>

          {/* Deposit History */}
          <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 backdrop-blur-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-400/25 flex items-center justify-center">
                <FaHistory className="text-blue-400 text-lg" />
              </div>
              <div>
                <h2 className="font-bold text-xl">Deposit History</h2>
                <p className="text-gray-500 text-xs">Your recent deposits</p>
              </div>
            </div>

            {fetchingHistory ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : deposits.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <FaWallet className="text-4xl mx-auto mb-3 opacity-20" />
                <p className="text-sm">No deposits yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1 custom-scroll">
                {deposits.map(dep => (
                  <div
                    key={dep._id}
                    className="bg-white/3 border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${dep.status === "Confirmed"
                            ? "bg-green-500/15 text-green-400"
                            : "bg-yellow-500/15 text-yellow-400"
                          }`}>
                          {dep.status === "Confirmed" ? <FaCheckCircle /> : <FaClock />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">₹{dep.amount.toLocaleString("en-IN")}</p>
                          <p className="text-gray-500 text-xs">{new Date(dep.createdAt).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${dep.status === "Confirmed"
                          ? "bg-green-400/10 border-green-400/30 text-green-400"
                          : "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                        }`}>
                        {dep.status}
                      </span>
                    </div>

                    {dep.transactionId && (
                      <div className="mb-2">
                        <span className="text-[10px] text-gray-400 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                          UTR: {dep.transactionId}
                        </span>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
