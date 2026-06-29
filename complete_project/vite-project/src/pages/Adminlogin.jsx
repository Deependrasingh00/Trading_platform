import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaBitcoin, FaShieldAlt } from "react-icons/fa";
import ScrollToTop from "../components/ScrollToTop";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Already logged in admin → redirect
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) navigate("/admin", { replace: true });
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/admin/login`, {
        username,
        password,
      });
      localStorage.setItem("adminToken", res.data.token);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#020817] text-white min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <ScrollToTop />
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/8 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/8 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
            <FaBitcoin className="text-cyan-400 text-3xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">CryptoX</h1>
            <p className="text-gray-400 text-xs flex items-center gap-1">
              <FaShieldAlt className="text-cyan-400 text-xs" />
              Admin Panel
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[40px] p-10 shadow-2xl backdrop-blur-lg">
          <h2 className="text-3xl font-bold text-center mb-2">Admin Login</h2>
          <p className="text-gray-400 text-center text-sm mb-8">Authorized access only</p>

          {error && (
            <div className="mb-6 p-3 rounded-2xl bg-red-500/10 border border-red-400/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">Username</label>
              <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-2xl px-5 py-4 transition-all">
                <FaUser className="text-cyan-400 text-sm shrink-0" />
                <input type="text" placeholder="Admin username" value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  className="bg-transparent outline-none w-full ml-4 text-white placeholder-gray-600 text-sm" required />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">Password</label>
              <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-2xl px-5 py-4 transition-all">
                <FaLock className="text-cyan-400 text-sm shrink-0" />
                <input type="password" placeholder="Admin password" value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="bg-transparent outline-none w-full ml-4 text-white placeholder-gray-600 text-sm" required />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg shadow-cyan-500/20 mt-2">
              {loading ? "Logging in..." : "Login to Admin Panel"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          © {new Date().getFullYear()} CryptoX. Secure Admin Access.
        </p>
      </div>
    </div>
  );
}
