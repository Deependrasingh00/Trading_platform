import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaTimes, FaBitcoin } from "react-icons/fa";
import axios from "axios";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userProfit, setUserProfit] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const userEmail = localStorage.getItem("userEmail") || "";

  const [tickerItems, setTickerItems] = useState([
    { name: "BTC/USD", price: 67240.50, change: 1.25 },
    { name: "ETH/USD", price: 3512.20, change: -0.45 },
    { name: "SOL/USD", price: 148.80, change: 4.82 },
    { name: "AAPL", price: 214.30, change: 0.85 },
    { name: "TSLA", price: 187.40, change: -2.10 },
    { name: "NVDA", price: 127.20, change: 3.40 },
    { name: "MSFT", price: 442.50, change: 0.15 },
    { name: "NIFTY 50", price: 23516.00, change: 0.62 },
  ]);

  // Re-check token on every route change
  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("userName");
    setIsLoggedIn(!!token);
    setUserName(name || "");
  }, [location]);

  // Fetch and calculate total user profit
  const fetchUserProfit = async () => {
    if (!userEmail) {
      setUserProfit(0);
      return;
    }
    try {
      // Check if withdrawal is complete (status: "Approved", step: 4)
      const wRes = await axios.get(`${API_BASE_URL}/api/withdrawals/user/${encodeURIComponent(userEmail)}`);
      const allW = wRes.data;
      const hasCompletedWithdrawal = allW.some(w => w.status === "Approved" && w.step === 4);

      if (hasCompletedWithdrawal) {
        setUserProfit(0);
        return;
      }

      // Calculate balance based on deposits and trades
      const [depRes, tradeRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/deposits/user/${encodeURIComponent(userEmail)}`),
        axios.get(`${API_BASE_URL}/api/trades/user/${encodeURIComponent(userEmail)}`)
      ]);

      const confirmed = depRes.data.filter(d => d.status === "Confirmed");
      const totalDeposited = confirmed.reduce((sum, d) => sum + d.amount, 0);

      const totalOngoingTradesAmount = tradeRes.data
        .filter(t => t.status === "ongoing")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalTradeProfits = tradeRes.data
        .filter(t => t.status === "completed")
        .reduce((sum, t) => sum + (t.profitAmount || 0), 0);

      const totalWithdrawn = allW
        .filter(w => w.status === "Approved" && w.step === 4)
        .reduce((sum, w) => sum + w.amount, 0);

      const currentBalance = totalDeposited + totalTradeProfits - totalOngoingTradesAmount - totalWithdrawn;
      setUserProfit(currentBalance >= 0 ? currentBalance : 0);
    } catch (_) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/settings`);
      setAnnouncement(res.data.announcementBanner || "");
    } catch (_) {}
  };

  const checkSuspension = async () => {
    if (!userEmail) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/status/${encodeURIComponent(userEmail)}`);
      if (res.data.isSuspended) {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        alert("🚨 Your account has been suspended by the administrator.");
        window.location.href = "/login";
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchUserProfit();
    fetchSettings();
    checkSuspension();
    const interval = setInterval(() => {
      fetchUserProfit();
      fetchSettings();
      checkSuspension();
    }, 5000);
    return () => clearInterval(interval);
  }, [userEmail, location]);

  // Fluctuating ticker prices
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerItems(prev =>
        prev.map(item => {
          const percent = (Math.random() * 0.4 - 0.2); // -0.2% to +0.2%
          const newPrice = Number((item.price * (1 + percent / 100)).toFixed(2));
          const newChange = Number((item.change + percent).toFixed(2));
          return { ...item, price: newPrice, change: newChange };
        })
      );
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    navigate("/login", { replace: true });
  };

  const navItems = [
    { to: "/home", label: "Home" },
    { to: "/graph", label: "Markets" },
    { to: "/deposit", label: "Deposit" },
    { to: "/developers", label: "Withdrawal" },
    { to: "/businesses", label: "About" }
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#020817]/80 border-b border-white/10">
      {announcement && (
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs py-2 px-4 flex items-center justify-between font-sans border-b border-cyan-400/20 relative z-50 shadow-md">
          <div className="flex-1 text-center font-bold tracking-wide flex items-center justify-center overflow-hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0 mr-3" />
            <marquee className="font-semibold select-none">{announcement}</marquee>
          </div>
        </div>
      )}
      <style>{`
        @keyframes tickerAnimation {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .ticker-container {
          width: 100%;
          overflow: hidden;
          background: rgba(2, 8, 23, 0.4);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          height: 36px;
          display: flex;
          align-items: center;
        }
        .ticker-wrapper {
          display: inline-block;
          white-space: nowrap;
          animation: tickerAnimation 30s linear infinite;
        }
        .ticker-item-span {
          display: inline-block;
          padding: 0 1.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.025em;
        }
      `}</style>
      <nav className="px-6 lg:px-10 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center group-hover:scale-105 transition-all">
              <FaBitcoin className="text-cyan-400 text-xl" />
            </div>
            <div>
              <h1 className="text-white text-lg font-bold tracking-wide leading-tight">CryptoX</h1>
              <p className="text-gray-500 text-xs">Future Of Finance</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative py-1.5 text-sm font-medium transition-all duration-300 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[2px] after:bottom-0 after:left-0 after:bg-gradient-to-r after:from-cyan-400 after:to-blue-500 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left ${
                    isActive ? "text-cyan-400 after:scale-x-100" : "text-gray-400 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  {userName && (
                    <span className="text-xs text-gray-400">Hi, <span className="text-white font-semibold">{userName}</span></span>
                  )}
                  <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-400/20 px-2 py-0.5 rounded-full shadow-lg shadow-green-500/5 select-none animate-pulse">
                    Balance: ₹{userProfit.toLocaleString("en-IN")}
                  </span>
                </div>
                <button onClick={handleLogout}
                  className="bg-red-500/10 border border-red-400/30 hover:bg-red-500/20 text-red-400 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login"
                className="bg-cyan-500 hover:bg-cyan-400 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
                Login
              </Link>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-white text-xl p-2">
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-5">
            <ul className="flex flex-col gap-4 mb-5">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `block text-sm font-medium transition-all ${isActive ? "text-cyan-400" : "text-gray-300 hover:text-cyan-400"}`
                    }>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
             {isLoggedIn && (
               <div className="text-center py-2.5 mb-3 bg-green-500/10 border border-green-400/25 text-green-400 text-xs font-bold rounded-xl animate-pulse">
                 Balance: ₹{userProfit.toLocaleString("en-IN")}
               </div>
             )}
            {isLoggedIn ? (
              <button onClick={() => { setIsOpen(false); handleLogout(); }}
                className="w-full bg-red-500/10 border border-red-400/30 text-red-400 py-3 rounded-xl text-sm font-semibold">
                Logout
              </button>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)}
                className="block w-full bg-cyan-500 text-center text-white py-3 rounded-xl text-sm font-semibold">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Markets Ticker Bar */}
      <div className="ticker-container select-none">
        <div className="ticker-wrapper">
          {[...tickerItems, ...tickerItems].map((item, idx) => (
            <span key={idx} className="ticker-item-span">
              <span className="text-gray-500 mr-2 font-medium">{item.name}</span>
              <span className="text-white font-mono mr-2">₹{item.price.toLocaleString("en-IN")}</span>
              <span className={item.change >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {item.change >= 0 ? "▲" : "▼"} {Math.abs(item.change).toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
