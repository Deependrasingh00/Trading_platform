import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaClock, FaTools, FaBitcoin } from "react-icons/fa";
import { API_BASE_URL } from "../config";

export default function MaintenanceGuard({ children }) {
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdminRoute = 
    window.location.pathname.startsWith("/admin") || 
    window.location.pathname.startsWith("/admin-login");

  const checkStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/settings`);
      setMaintenance(!!res.data.maintenanceMode);
    } catch (_) {
      // In case server fails to connect, fallback to false so we don't lock users out
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // Poll status every 5 seconds to sync dynamically
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If in maintenance mode and NOT accessing admin dashboard/login
  if (maintenance && !isAdminRoute) {
    return (
      <div className="min-h-screen bg-[#020817] text-white flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden font-sans select-none">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="w-full max-w-xl text-center relative z-10 space-y-8">
          {/* Brand Logo */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
              <FaBitcoin className="text-cyan-400 text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wider text-white">CryptoX</h1>
            </div>
          </div>

          {/* Glowing Tool Icon Card */}
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-[36px] bg-red-500/10 border border-red-500/20 shadow-2xl relative">
            <div className="absolute inset-0 bg-red-500/5 blur-xl rounded-full" />
            <FaTools className="text-red-400 text-4xl animate-pulse relative z-10" />
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Website is under <br />
              <span className="bg-gradient-to-r from-red-400 to-amber-500 bg-clip-text text-transparent">
                Scheduled Maintenance
              </span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              We are currently performing scheduled infrastructure upgrades to enhance trading matching speeds and security protocols.
            </p>
          </div>

          {/* Status Box */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5 backdrop-blur-md max-w-md mx-auto flex items-center gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 shrink-0">
              <FaClock className="text-sm" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Estimated Restoral</p>
              <p className="text-sm font-semibold text-white mt-0.5">We will be back online shortly. Thank you for your patience!</p>
            </div>
          </div>

          {/* Quick spinner */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            <span className="text-xs text-gray-600 font-medium tracking-wide">Syncing status...</span>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, allow standard rendering
  return children;
}
