import React, { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import {
  FaBitcoin, FaCheck, FaTimes, FaSignOutAlt, FaSync,
  FaClock, FaUser, FaRupeeSign, FaWallet, FaPercentage,
  FaCheckCircle, FaChartLine, FaCog
} from "react-icons/fa";

const STEP_INFO = {
  0: { label: "New Request",    color: "text-gray-400",   bg: "bg-gray-400/10 border-gray-400/30" },
  1: { label: "Charge Pending", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
  2: { label: "GST Pending",    color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" },
  3: { label: "Security Charge",color: "text-red-400",    bg: "bg-red-400/10 border-red-400/30" },
  4: { label: "Complete ✅",    color: "text-green-400",  bg: "bg-green-400/10 border-green-400/30" },
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab]   = useState("withdrawals"); // "withdrawals" | "deposits" | "settings"
  const [requests, setRequests]     = useState([]);
  const [deposits, setDeposits]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [actionMsg, setActionMsg]   = useState({ text: "", type: "" });
  const [filter, setFilter]         = useState("All");
  const [depositFilter, setDepositFilter] = useState("All"); // "All" | "Pending" | "Confirmed"
  
  // Settings tab state
  const [settingsForm, setSettingsForm] = useState({ upiId: "", qrCodeUrl: "", maintenanceMode: false, announcementBanner: "" });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Profit modal state
  const [profitModal, setProfitModal] = useState(null); // { depositId, currentAmount }
  const [profitInput, setProfitInput] = useState("");
  const [profitLoading, setProfitLoading] = useState(false);

  // Custom message inputs per withdrawal: { [requestId]: string }
  const [msgInputs, setMsgInputs] = useState({});
  const [msgSending, setMsgSending] = useState({});

  const navigate = useNavigate();

  const token = () => localStorage.getItem("adminToken");

  const showMsg = useCallback((text, type) => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: "", type: "" }), 3000);
  }, []);

  const playNotificationSound = useCallback(() => {
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
  }, []);

  const fetchRequests = useCallback(async () => {
    if (!token()) { navigate("/admin-login", { replace: true }); return; }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/requests`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setRequests(prev => {
        if (prev && prev.length > 0) {
          const newPendingCount = res.data.filter(r => r.status === "Pending").length;
          const oldPendingCount = prev.filter(r => r.status === "Pending").length;
          if (newPendingCount > oldPendingCount) {
            playNotificationSound();
            showMsg("🔔 New Withdrawal Request Received!", "success");
          }
        }
        return res.data;
      });
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("adminToken");
        navigate("/admin-login", { replace: true });
      }
    } finally { setLoading(false); }
  }, [navigate, playNotificationSound, showMsg]);

  const fetchDeposits = useCallback(async () => {
    if (!token()) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/deposits/admin/all`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setDeposits(prev => {
        if (prev && prev.length > 0) {
          const newPendingCount = res.data.filter(d => d.status === "Pending").length;
          const oldPendingCount = prev.filter(d => d.status === "Pending").length;
          if (newPendingCount > oldPendingCount) {
            playNotificationSound();
            showMsg("🔔 New Deposit Request Received!", "success");
          }
        }
        return res.data;
      });
    } catch (_) {}
  }, [playNotificationSound, showMsg]);

  const fetchSettings = useCallback(async () => {
    if (!token()) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/settings`);
      setSettingsForm({ 
        upiId: res.data.upiId, 
        qrCodeUrl: res.data.qrCodeUrl,
        maintenanceMode: res.data.maintenanceMode || false,
        announcementBanner: res.data.announcementBanner || ""
      });
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchDeposits();
    fetchSettings();

    const interval = setInterval(() => {
      fetchRequests();
      fetchDeposits();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchRequests, fetchDeposits, fetchSettings]);

  const handleApprove = async (id) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/admin/approve/${id}`, {},
        { headers: { Authorization: `Bearer ${token()}` } });
      showMsg(`✅ Approved! Now at Step ${res.data.step}`, "success");
      fetchRequests();
    } catch { showMsg("❌ Failed to approve", "error"); }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/reject/${id}`, {},
        { headers: { Authorization: `Bearer ${token()}` } });
      showMsg("🚫 Request rejected", "error");
      fetchRequests();
    } catch { showMsg("❌ Failed to reject", "error"); }
  };

  const handleConfirmDeposit = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/api/deposits/admin/confirm/${id}`,
        { profitAmount: 0 },
        { headers: { Authorization: `Bearer ${token()}` } });
      showMsg("✅ Deposit confirmed!", "success");
      fetchDeposits();
    } catch { showMsg("❌ Failed to confirm deposit", "error"); }
  };

  const handleSetProfit = async () => {
    if (!profitModal) return;
    const amt = parseFloat(profitInput);
    if (isNaN(amt) || amt < 0) return showMsg("Enter a valid profit amount", "error");
    setProfitLoading(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/deposits/admin/set-profit/${profitModal.depositId}`,
        { profitAmount: amt },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      showMsg(`✅ Profit set to ₹${amt}`, "success");
      setProfitModal(null);
      fetchDeposits();
    } catch { showMsg("❌ Failed to set profit", "error"); }
    finally { setProfitLoading(false); }
  };

  const handleClearProcessed = async () => {
    if (!window.confirm("Are you sure you want to clear all processed (completed and rejected) withdrawal requests?")) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/admin/requests/clear-processed`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      showMsg(`🗑️ Processed requests cleared! (${res.data.count} items deleted)`, "success");
      fetchRequests();
    } catch {
      showMsg("❌ Failed to clear requests", "error");
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this processed request record?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/requests/${id}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      showMsg("🗑️ Request deleted!", "success");
      fetchRequests();
    } catch {
      showMsg("❌ Failed to delete request", "error");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      showMsg("❌ Image size must be less than 5MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettingsForm(prev => ({ ...prev, qrCodeUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/api/admin/settings`, settingsForm, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      showMsg("✅ Settings updated successfully!", "success");
      fetchSettings();
    } catch {
      showMsg("❌ Failed to update settings", "error");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSendMessage = async (reqId) => {
    const msg = msgInputs[reqId] || "";
    setMsgSending(prev => ({ ...prev, [reqId]: true }));
    try {
      await axios.put(`${API_BASE_URL}/api/admin/message/${reqId}`,
        { customMessage: msg },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      showMsg(msg.trim() ? "✅ Message sent to user!" : "🗑️ Message cleared.", "success");
      fetchRequests();
    } catch { showMsg("❌ Failed to send message", "error"); }
    finally { setMsgSending(prev => ({ ...prev, [reqId]: false })); }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin-login", { replace: true });
  };

  const filtered = filter === "All" ? requests : requests.filter(r => r.status === filter);
  const counts = {
    All:      requests.length,
    Pending:  requests.filter(r => r.status === "Pending").length,
    Approved: requests.filter(r => r.status === "Approved").length,
    Rejected: requests.filter(r => r.status === "Rejected").length,
  };

  const depositCounts = {
    total:     deposits.length,
    pending:   deposits.filter(d => d.status === "Pending").length,
    confirmed: deposits.filter(d => d.status === "Confirmed").length,
    totalAmt:  deposits.reduce((s, d) => s + d.amount, 0),
  };

  return (
    <div className="bg-[#020817] text-white min-h-screen pb-12">
      <ScrollToTop />

      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#020817]/90 backdrop-blur-xl border-b border-white/10 px-6 lg:px-20 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
              <FaBitcoin className="text-cyan-400 text-xl" />
            </div>
            <div>
              <h1 className="font-bold text-lg">CryptoX Admin</h1>
              <p className="text-gray-400 text-xs">Management Dashboard</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab("deposits"); setFilter("All"); setDepositFilter("All"); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                activeTab === "deposits"
                  ? "bg-cyan-500 text-white"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:border-cyan-400/40 hover:text-cyan-400"
              }`}
            >
              <FaWallet className="text-xs" /> Deposits
              {depositCounts.pending > 0 && (
                <span className="ml-1.5 bg-yellow-500 text-slate-950 font-bold px-1.5 py-0.5 text-[10px] rounded-full shrink-0">
                  {depositCounts.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab("withdrawals"); setFilter("All"); setDepositFilter("All"); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                activeTab === "withdrawals"
                  ? "bg-cyan-500 text-white"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:border-cyan-400/40 hover:text-cyan-400"
              }`}
            >
              <FaChartLine className="text-xs" /> Withdrawals
              {counts.Pending > 0 && (
                <span className="ml-1.5 bg-yellow-500 text-slate-950 font-bold px-1.5 py-0.5 text-[10px] rounded-full shrink-0">
                  {counts.Pending}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab("users"); setFilter("All"); setDepositFilter("All"); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "users"
                  ? "bg-cyan-500 text-white"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:border-cyan-400/40 hover:text-cyan-400"
              }`}
            >
              <FaUser className="text-xs" /> Users
            </button>
            <button
              onClick={() => { setActiveTab("settings"); setFilter("All"); setDepositFilter("All"); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "settings"
                  ? "bg-cyan-500 text-white"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:border-cyan-400/40 hover:text-cyan-400"
              }`}
            >
              <FaCog className="text-xs" /> Settings
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { fetchRequests(); fetchDeposits(); fetchSettings(); }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/40 transition-all text-gray-400 hover:text-cyan-400"
            >
              <FaSync className="text-sm" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/10 border border-red-400/30 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-20 py-10">

        {/* Action message */}
        {actionMsg.text && (
          <div className={`mb-6 p-4 rounded-2xl border font-semibold text-center text-sm ${
            actionMsg.type === "success"
              ? "bg-green-500/10 border-green-400/30 text-green-400"
              : "bg-red-500/10 border-red-400/30 text-red-400"
          }`}>
            {actionMsg.text}
          </div>
        )}

        {/* ══════════════ DEPOSITS TAB ══════════════ */}
        {activeTab === "deposits" && (
          <>
            {/* Deposit Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Deposits",   count: depositCounts.total,     color: "cyan",    filterKey: "All" },
                { label: "Pending",          count: depositCounts.pending,   color: "yellow",  filterKey: "Pending" },
                { label: "Confirmed",        count: depositCounts.confirmed, color: "green",   filterKey: "Confirmed" },
                { label: "Total Amount",     count: `₹${depositCounts.totalAmt.toLocaleString("en-IN")}`, color: "purple", filterKey: null },
              ].map(({ label, count, color, filterKey }) => (
                <div 
                  key={label}
                  onClick={() => filterKey && setDepositFilter(filterKey)}
                  className={`bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/20 transition-all ${
                    filterKey ? "cursor-pointer hover:bg-white/10" : ""
                  }`}
                >
                  <p className="text-gray-400 text-sm mb-1">{label}</p>
                  <p className={`text-2xl font-bold text-${color}-400`}>{count}</p>
                </div>
              ))}
            </div>

            {/* Deposits Filter sub-tab */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {[
                { key: "All", label: "All Deposits", count: depositCounts.total },
                { key: "Pending", label: "Pending Deposits (Action Required)", count: depositCounts.pending },
                { key: "Confirmed", label: "Confirmed Deposits (Set Profit)", count: depositCounts.confirmed },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setDepositFilter(key)}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    depositFilter === key
                      ? "bg-cyan-500 text-white"
                      : "bg-white/5 border border-white/10 text-gray-400 hover:border-cyan-400/40 hover:text-cyan-400"
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>

            {/* Deposits List */}
            {(() => {
              const filteredDeposits = depositFilter === "All"
                ? deposits
                : deposits.filter(d => d.status === depositFilter);

              if (filteredDeposits.length === 0) {
                return (
                  <div className="text-center py-32 text-gray-500 bg-white/2 border border-white/5 rounded-2xl w-full">
                    <FaWallet className="text-5xl mx-auto mb-4 opacity-30" />
                    <p>No {depositFilter !== "All" ? depositFilter.toLowerCase() : ""} deposits found.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredDeposits.map(dep => (
                    <div
                      key={dep._id}
                      className="bg-white/5 border border-white/10 hover:border-cyan-500/20 rounded-2xl p-6 transition-all shadow-lg"
                    >
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 text-sm">
                          {/* User */}
                          <div>
                            <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><FaUser className="text-xs" /> User</p>
                            <p className="font-semibold">{dep.userName || "—"}</p>
                            <p className="text-gray-500 text-xs break-all">{dep.userEmail}</p>
                            {dep.mobile && <p className="text-gray-500 text-xs">{dep.mobile}</p>}
                            {dep.transactionId && (
                              <p className="text-[10px] text-cyan-400 font-mono mt-1.5 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded inline-block">
                                UTR: {dep.transactionId}
                              </p>
                            )}
                          </div>
                          {/* Amount */}
                          <div>
                            <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><FaRupeeSign className="text-xs" /> Amount</p>
                            <p className="font-bold text-cyan-400 text-xl">₹{dep.amount.toLocaleString("en-IN")}</p>
                            <p className="text-gray-500 text-xs">{new Date(dep.createdAt).toLocaleDateString("en-IN")}</p>
                          </div>
                          {/* Profit */}
                          <div>
                            <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><FaRupeeSign className="text-xs" /> Profit Added</p>
                            <p className="font-bold text-green-400 text-xl">
                              ₹{(dep.profitAmount || 0).toLocaleString("en-IN")}
                            </p>
                            <p className="text-gray-500 text-xs font-mono">({(dep.profitPercent || 0).toFixed(1)}%)</p>
                          </div>
                          {/* Status */}
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Status</p>
                            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${
                              dep.status === "Confirmed"
                                ? "bg-green-400/10 border-green-400/30 text-green-400"
                                : "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                            }`}>
                              {dep.status}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 items-start shrink-0 flex-wrap">
                          {dep.status === "Pending" ? (
                            <button
                              onClick={() => handleConfirmDeposit(dep._id)}
                              className="flex items-center gap-2 bg-green-500/10 border border-green-400/30 hover:bg-green-500/20 text-green-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            >
                              <FaCheck /> Confirm Deposit
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setProfitModal({ depositId: dep._id, currentAmount: dep.profitAmount });
                                setProfitInput(String(dep.profitAmount || ""));
                              }}
                              className="flex items-center gap-2 bg-purple-500/10 border border-purple-400/30 hover:bg-purple-500/20 text-purple-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            >
                              <FaPercentage /> Set Profit (₹)
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-600">
                        ID: {dep._id} · {new Date(dep.createdAt).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </>
        )}

        {/* ══════════════ WITHDRAWALS TAB ══════════════ */}
        {activeTab === "withdrawals" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total",    count: counts.All,      color: "cyan" },
                { label: "Pending",  count: counts.Pending,  color: "yellow" },
                { label: "Approved", count: counts.Approved, color: "green" },
                { label: "Rejected", count: counts.Rejected, color: "red" },
              ].map(({ label, count, color }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/20 transition-all">
                  <p className="text-gray-400 text-sm mb-1">{label}</p>
                  <p className={`text-3xl font-bold text-${color}-400`}>{count}</p>
                </div>
              ))}
            </div>

            {/* Filter tabs & Clear Action */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div className="flex gap-2 flex-wrap">
                {["All", "Pending", "Approved", "Rejected"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      filter === f
                        ? "bg-cyan-500 text-white"
                        : "bg-white/5 border border-white/10 text-gray-400 hover:border-cyan-400/40 hover:text-cyan-400"
                    }`}
                  >
                    {f} ({counts[f] || 0})
                  </button>
                ))}
              </div>
              {(() => {
                const processedCount = requests.filter(r => r.status === "Rejected" || (r.status === "Approved" && r.step === 4)).length;
                if (processedCount > 0) {
                  return (
                    <button
                      onClick={handleClearProcessed}
                      className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                    >
                      🗑️ Clear Processed ({processedCount})
                    </button>
                  );
                }
                return null;
              })()}
            </div>

            {/* Requests */}
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Loading requests...</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-32 text-gray-500">
                <FaClock className="text-5xl mx-auto mb-4 opacity-30" />
                <p>No {filter !== "All" ? filter.toLowerCase() : ""} requests found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((req) => {
                  const stepInfo = STEP_INFO[req.step] || STEP_INFO[0];
                  return (
                    <div
                      key={req._id}
                      className="bg-white/5 border border-white/10 hover:border-cyan-500/20 rounded-2xl p-6 transition-all"
                    >
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><FaUser className="text-xs" /> User</p>
                            <p className="font-semibold">{req.user}</p>
                            <p className="text-gray-500 text-xs">{req.mobile}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><FaRupeeSign className="text-xs" /> Amount</p>
                            <p className="font-bold text-cyan-400 text-lg">₹{req.amount}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Bank Details</p>
                            <p className="font-semibold text-xs">{req.account || "—"}</p>
                            <p className="text-gray-500 text-xs">{req.ifsc || "—"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Status & Step</p>
                            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${
                              req.status === "Approved" ? "bg-green-400/10 border-green-400/30 text-green-400"
                              : req.status === "Rejected" ? "bg-red-400/10 border-red-400/30 text-red-400"
                              : "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                            }`}>
                              {req.status}
                            </span>
                            <span className={`inline-block ml-2 text-xs font-semibold px-3 py-1 rounded-full border ${stepInfo.bg} ${stepInfo.color}`}>
                              Step {req.step}
                            </span>
                            <p className={`text-xs mt-1 ${stepInfo.color}`}>{stepInfo.label}</p>
                          </div>
                        </div>

                        {req.status === "Pending" ? (
                          <div className="flex gap-2 items-start shrink-0">
                            <button
                              onClick={() => handleApprove(req._id)}
                              className="flex items-center gap-2 bg-green-500/10 border border-green-400/30 hover:bg-green-500/20 text-green-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            >
                              <FaCheck /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(req._id)}
                              className="flex items-center gap-2 bg-red-500/10 border border-red-400/30 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            >
                              <FaTimes /> Reject
                            </button>
                          </div>
                        ) : (
                          (req.status === "Rejected" || (req.status === "Approved" && req.step === 4)) && (
                            <button
                              onClick={() => handleDeleteRequest(req._id)}
                              className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                            >
                              🗑️ Delete
                            </button>
                          )
                        )}
                      </div>

                      {/* Custom Message for user */}
                      <div className="mt-4 pt-4 border-t border-white/8">
                        <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">💬 Custom Message to User</p>
                        {req.customMessage && (
                          <div className="mb-2 px-3 py-2 bg-cyan-500/10 border border-cyan-400/20 rounded-xl text-xs text-cyan-300">
                            Current: <span className="font-semibold">{req.customMessage}</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={msgInputs[req._id] ?? (req.customMessage || "")}
                            onChange={e => setMsgInputs(prev => ({ ...prev, [req._id]: e.target.value }))}
                            placeholder={`Default: Step ${req.step} message (leave blank to reset)`}
                            className="flex-1 bg-[#0B1120] border border-white/10 focus:border-cyan-400/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
                          />
                          <button
                            onClick={() => handleSendMessage(req._id)}
                            disabled={msgSending[req._id]}
                            className="bg-cyan-500/15 border border-cyan-400/30 hover:bg-cyan-500/25 text-cyan-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shrink-0"
                          >
                            {msgSending[req._id] ? "Sending..." : "Send"}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-600">
                        ID: {req._id} · {new Date(req.createdAt).toLocaleString("en-IN")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════════ USERS TAB ══════════════ */}
        {activeTab === "users" && (
          <AdminUsersTab token={token()} showMsg={showMsg} />
        )}

        {/* ══════════════ SETTINGS TAB ══════════════ */}
        {activeTab === "settings" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-lg mx-auto backdrop-blur-lg shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center">
                <FaCog className="text-cyan-400 text-xl" />
              </div>
              <div>
                <h2 className="font-bold text-xl">Deposit Settings</h2>
                <p className="text-gray-500 text-xs">Manage active payment channels</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div>
                <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider font-semibold">Global Announcement Banner</label>
                <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-2xl px-5 py-4 transition-all">
                  <input
                    type="text"
                    value={settingsForm.announcementBanner}
                    onChange={e => setSettingsForm({ ...settingsForm, announcementBanner: e.target.value })}
                    placeholder="Enter announcement message (e.g. Server upgrades completed!)"
                    className="bg-transparent outline-none w-full text-white placeholder-gray-600 text-sm"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 ml-1">Leave blank to hide the announcement banner for users.</p>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider font-semibold">UPI ID</label>
                <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-2xl px-5 py-4 transition-all">
                  <FaWallet className="text-cyan-400 text-sm shrink-0" />
                  <input
                    type="text"
                    value={settingsForm.upiId}
                    onChange={e => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                    placeholder="Enter UPI ID e.g. company@upi"
                    className="bg-transparent outline-none w-full ml-4 text-white placeholder-gray-600 text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider font-semibold">Upload QR Code Image</label>
                <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-2xl px-5 py-4 transition-all">
                  <FaCog className="text-cyan-400 text-sm shrink-0" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="bg-transparent outline-none w-full ml-4 text-white text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/15 file:text-cyan-400 hover:file:bg-cyan-500/25"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 ml-1">Upload a PNG or JPEG file containing your UPI QR code.</p>
              </div>

              {settingsForm.qrCodeUrl && (
                <div className="bg-slate-950/40 p-4 border border-white/5 rounded-2xl flex flex-col items-center mb-6">
                  <p className="text-xs text-gray-500 mb-3 font-semibold">Live Preview</p>
                  <div className="bg-white p-2.5 rounded-xl shadow-lg">
                    <img
                      src={settingsForm.qrCodeUrl}
                      alt="QR Preview"
                      className="w-32 h-32 object-contain rounded-lg"
                      onError={(e) => {
                        e.target.src = "https://placehold.co/150x150/0f172a/FFF?text=Invalid+QR+URL";
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Maintenance Mode Toggle */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-red-400">Maintenance Mode</h4>
                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                      Turn on to restrict access to the site. All users will see a maintenance message screen. The Admin Dashboard will remain accessible.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settingsForm.maintenanceMode}
                      onChange={e => setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={settingsLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 py-4 rounded-2xl font-bold text-base flex items-center justify-center transition-all duration-300 shadow-lg shadow-cyan-500/20"
              >
                {settingsLoading ? "Saving..." : "Update Settings"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ══════════════ PROFIT MODAL ══════════════ */}
      {profitModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4"
          onClick={() => setProfitModal(null)}
        >
          <div
            className="bg-[#0B1120] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-400/25 flex items-center justify-center">
                <FaRupeeSign className="text-purple-400 text-lg" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Set Profit Amount</h3>
                <p className="text-gray-500 text-xs">Enter direct profit amount in ₹</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider font-semibold">
                Profit Amount (₹)
              </label>
              <div className="flex items-center bg-[#020817] border border-white/10 focus-within:border-purple-400/50 rounded-2xl px-5 py-4 transition-all">
                <FaRupeeSign className="text-purple-400 text-sm shrink-0" />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={profitInput}
                  onChange={e => setProfitInput(e.target.value)}
                  placeholder="e.g. 1500"
                  className="bg-transparent outline-none w-full ml-4 text-white placeholder-gray-600 text-sm"
                  autoFocus
                />
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Current: ₹{(profitModal.currentAmount || 0).toLocaleString("en-IN")}
              </p>
            </div>

            {/* Quick Profit Options */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[500, 1000, 2500, 5000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setProfitInput(String(amt))}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    profitInput === String(amt)
                      ? "bg-purple-500/20 border-purple-400/50 text-purple-400"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-purple-400/30 hover:text-purple-400"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setProfitModal(null)}
                className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 py-3 rounded-2xl font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSetProfit}
                disabled={profitLoading}
                className="flex-1 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                {profitLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><FaCheckCircle /> Set Profit</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminUsersTab({ token, showMsg }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (_) {
      showMsg("❌ Failed to fetch users list", "error");
    } finally {
      setLoading(false);
    }
  }, [token, showMsg]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/users/status/${id}`, 
        { isSuspended: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMsg(`✅ User status updated successfully!`, "success");
      fetchUsers();
    } catch (_) {
      showMsg("❌ Failed to update user status", "error");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Registered Users</h2>
          <p className="text-gray-500 text-xs mt-1">Manage user account credentials and suspension status.</p>
        </div>
        <div className="w-full sm:w-72 bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-xl px-4 py-2 transition-all">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="bg-transparent outline-none w-full text-white placeholder-gray-600 text-sm"
          />
        </div>
      </div>

      {/* Users list */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-24 text-gray-500 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-sm">No matching users found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-3xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs font-semibold uppercase tracking-wider bg-white/2">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Total Deposited</th>
                <th className="px-6 py-4">Total Profit</th>
                <th className="px-6 py-4">Withdrawn</th>
                <th className="px-6 py-4">Join Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map(user => (
                <tr key={user._id} className="hover:bg-white/3 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{user.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-cyan-400">
                    ₹{user.totalDeposited.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 font-bold text-green-400">
                    ₹{user.totalProfit.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 font-semibold text-yellow-500">
                    ₹{user.totalWithdrawn.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {(() => {
                      if (user.createdAt) return new Date(user.createdAt).toLocaleDateString("en-IN");
                      if (user._id && user._id.length === 24) {
                        try {
                          const timestamp = parseInt(user._id.substring(0, 8), 16) * 1000;
                          return new Date(timestamp).toLocaleDateString("en-IN");
                        } catch (_) {}
                      }
                      return "—";
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      user.isSuspended 
                        ? "bg-red-400/10 border-red-400/30 text-red-400" 
                        : "bg-green-400/10 border-green-400/30 text-green-400"
                    }`}>
                      {user.isSuspended ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(user._id, user.isSuspended)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        user.isSuspended
                          ? "bg-green-500/15 border-green-400/30 text-green-400 hover:bg-green-500/25"
                          : "bg-red-500/15 border-red-400/30 text-red-400 hover:bg-red-500/25"
                      }`}
                    >
                      {user.isSuspended ? "Activate" : "Suspend"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
