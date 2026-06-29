import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEnvelope, FaLock, FaUser, FaArrowRight, FaBitcoin, FaShieldAlt, FaChartLine, FaPhoneAlt, FaGlobe, FaKey } from "react-icons/fa";
import ScrollToTop from "../components/ScrollToTop";

export default function LoginRegister() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "", country: "" });
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/home", { replace: true });
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (isForgotPassword) {
        await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
          name: formData.name,
          email: formData.email,
          newPassword: formData.password,
        });
        setSuccess("Password reset successfully! Please login with your new password.");
        setIsForgotPassword(false);
        setIsLogin(true);
        setFormData({ name: "", email: "", password: "", phone: "", country: "" });
      } else if (isLogin) {
        const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userName", res.data.user?.name || "User");
        localStorage.setItem("userEmail", res.data.user?.email || formData.email);
        navigate("/home", { replace: true });
      } else {
        const res = await axios.post(`${API_BASE_URL}/api/auth/signup`, formData);
        if (res.data.requiresVerification) {
          setVerifyingEmail(formData.email);
          setIsVerifyingOtp(true);
          setSuccess("Account registered! Please enter the 6-digit OTP code sent to your email.");
        } else {
          setSuccess("Account created! Please login.");
          setIsLogin(true);
          setFormData({ name: "", email: "", password: "", phone: "", country: "" });
        }
      }
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        setVerifyingEmail(formData.email || err.response.data.email);
        setIsVerifyingOtp(true);
        setSuccess("Your account is not verified. Please enter the 6-digit OTP code.");
        setError("");
      } else {
        setError(err.response?.data?.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
        email: verifyingEmail,
        otp: otp,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userName", res.data.user?.name || "User");
      localStorage.setItem("userEmail", res.data.user?.email || verifyingEmail);
      setSuccess("Account verified successfully! Logging you in...");
      setIsVerifyingOtp(false);
      setTimeout(() => {
        navigate("/home", { replace: true });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <ScrollToTop />
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* LEFT */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
              <FaBitcoin className="text-cyan-400 text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">CryptoX</h1>
              <p className="text-gray-400 text-sm">Future Of Finance</p>
            </div>
          </div>
          <h2 className="text-5xl font-bold leading-tight mb-6">
            Trade Crypto <br />
            <span className="text-cyan-400">Smarter & Safer</span>
          </h2>
          <p className="text-gray-400 text-lg leading-8 mb-10">
            Join millions of investors on the most secure and reliable crypto trading platform.
          </p>
          <div className="space-y-4">
            {[
              { icon: FaShieldAlt, text: "Bank-grade security & encryption" },
              { icon: FaChartLine, text: "Real-time market analytics" },
              { icon: FaBitcoin,   text: "200+ cryptocurrencies available" },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                  <Icon />
                </div>
                <p className="text-gray-300">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT - Form */}
        <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl backdrop-blur-lg">
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
              <FaBitcoin className="text-cyan-400 text-2xl" />
            </div>
            <h1 className="text-xl font-bold">CryptoX</h1>
          </div>

          {isVerifyingOtp ? (
            <div>
              <h2 className="text-3xl font-bold mb-2 text-center">Verify Email</h2>
              <p className="text-gray-400 text-center mb-8 text-sm">
                Enter the 6-digit OTP verification code sent to <br />
                <span className="text-cyan-400 font-semibold">{verifyingEmail}</span>
              </p>

              {error && (
                <div className="mb-5 p-3 rounded-2xl bg-red-500/10 border border-red-400/30 text-red-400 text-sm text-center">{error}</div>
              )}
              {success && (
                <div className="mb-5 p-3 rounded-2xl bg-green-500/10 border border-green-400/30 text-green-400 text-sm text-center">{success}</div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider font-semibold">6-Digit Verification Code</label>
                  <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-2xl px-5 py-4 transition-all">
                    <FaKey className="text-cyan-400 text-sm shrink-0" />
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                      placeholder="• • • • • •" maxLength={6}
                      className="bg-transparent outline-none w-full ml-4 text-white placeholder-gray-600 text-lg tracking-widest text-center font-mono font-bold" required />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-cyan-500/20 mt-2">
                  {loading ? "Verifying..." : "Verify OTP"}
                  {!loading && <FaArrowRight />}
                </button>
              </form>

              <p className="text-center text-gray-500 mt-8 text-sm">
                <button onClick={() => { setIsVerifyingOtp(false); setSuccess(""); setError(""); }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                  Back to Registration
                </button>
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-3xl font-bold mb-2 text-center">
                {isForgotPassword ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-gray-400 text-center mb-8 text-sm">
                {isForgotPassword ? "Recover your account credentials" : isLogin ? "Login to your account" : "Start your crypto journey"}
              </p>

              {error && (
                <div className="mb-5 p-3 rounded-2xl bg-red-500/10 border border-red-400/30 text-red-400 text-sm text-center">{error}</div>
              )}
              {success && (
                <div className="mb-5 p-3 rounded-2xl bg-green-500/10 border border-green-400/30 text-green-400 text-sm text-center">{success}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {(!isLogin || isForgotPassword) && (
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">Full Name</label>
                    <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-2xl px-5 py-4 transition-all">
                      <FaUser className="text-cyan-400 text-sm shrink-0" />
                      <input type="text" name="name" value={formData.name} onChange={handleChange}
                        placeholder="Enter your registered name"
                        className="bg-transparent outline-none w-full ml-4 text-white placeholder-gray-600 text-sm" required />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">Email Address</label>
                  <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-2xl px-5 py-4 transition-all">
                    <FaEnvelope className="text-cyan-400 text-sm shrink-0" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      placeholder="Enter your email"
                      className="bg-transparent outline-none w-full ml-4 text-white placeholder-gray-600 text-sm" required />
                  </div>
                </div>
                {!isLogin && !isForgotPassword && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">Phone Number</label>
                      <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-2xl px-5 py-4 transition-all">
                        <FaPhoneAlt className="text-cyan-400 text-sm shrink-0" />
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                          placeholder="Enter your phone number"
                          className="bg-transparent outline-none w-full ml-4 text-white placeholder-gray-600 text-sm" required />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">Country</label>
                      <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-2xl px-5 py-4 transition-all">
                        <FaGlobe className="text-cyan-400 text-sm shrink-0" />
                        <input type="text" name="country" value={formData.country} onChange={handleChange}
                          placeholder="Enter your country"
                          className="bg-transparent outline-none w-full ml-4 text-white placeholder-gray-600 text-sm" required />
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
                    {isForgotPassword ? "New Password" : "Password"}
                  </label>
                  <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-2xl px-5 py-4 transition-all">
                    <FaLock className="text-cyan-400 text-sm shrink-0" />
                    <input type="password" name="password" value={formData.password} onChange={handleChange}
                      placeholder={isForgotPassword ? "Enter new password" : "Enter your password"}
                      className="bg-transparent outline-none w-full ml-4 text-white placeholder-gray-600 text-sm" required />
                  </div>
                </div>

                {isLogin && !isForgotPassword && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => { setIsForgotPassword(true); setError(""); setSuccess(""); }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-cyan-500/20 mt-2">
                  {loading ? "Please wait..." : isForgotPassword ? "Reset Password" : isLogin ? "Login to Account" : "Create Account"}
                  {!loading && <FaArrowRight />}
                </button>
              </form>

              <p className="text-center text-gray-500 mt-8 text-sm">
                {isForgotPassword ? (
                  <button onClick={() => { setIsForgotPassword(false); setIsLogin(true); setError(""); setSuccess(""); }}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                    Back to Login
                  </button>
                ) : (
                  <>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                      {isLogin ? "Sign Up" : "Login"}
                    </button>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

