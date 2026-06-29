import React from "react";
import { Link } from "react-router-dom";
import {
  FaBitcoin,
  FaChartLine,
  FaShieldAlt,
  FaGlobe,
  FaArrowRight,
  FaServer,
  FaUsers,
  FaDatabase,
  FaLock,
  FaChevronRight,
  FaCoins,
} from "react-icons/fa";

import CryptoCards from "./Cards";

function Home() {
  return (
    <div className="bg-[#020817] text-white overflow-hidden font-sans">
      {/* HERO SECTION */}
      <section className="relative px-6 md:px-12 lg:px-20 py-24 sm:py-32">
        {/* Glow Spheres */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-500/10 text-cyan-400 text-xs font-semibold mb-6 tracking-wider uppercase animate-pulse">
              <FaBitcoin className="text-sm" />
              Next-Gen Crypto Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-none tracking-tight">
              The Future Of <br />
              Digital Assets <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Starts Here.
              </span>
            </h1>

            <p className="text-gray-400 text-lg leading-relaxed mt-6 max-w-xl">
              Buy, sell, and trade over 200+ cryptocurrencies with institutional-grade security, lightning-fast transaction matching, and the lowest trading fees in the industry.
            </p>

            <div className="flex flex-wrap gap-5 mt-10">
              <Link
                to="/login"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Get Started
                <FaArrowRight className="text-sm" />
              </Link>

              <Link
                to="/graph"
                className="border border-white/10 hover:border-cyan-400/40 hover:bg-white/5 hover:text-cyan-400 transition-all duration-300 px-8 py-4 rounded-2xl font-semibold flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                Explore Markets
                <FaChevronRight className="text-xs" />
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center">
            {/* Background glowing frame */}
            <div className="absolute inset-0 bg-cyan-500/10 blur-[120px] rounded-full"></div>

            <div className="relative bg-white/3 backdrop-blur-xl border border-white/10 rounded-[40px] p-6 max-w-md w-full shadow-2xl hover:border-cyan-400/20 transition-all duration-500 group animate-float">
              {/* Graphic element inside frame */}
              <div className="absolute top-4 right-4 bg-green-500/15 border border-green-500/30 text-green-400 text-xs px-2.5 py-1 rounded-full font-bold">
                ▲ Live Feeds
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 mb-6">
                <FaChartLine className="text-xl" />
              </div>
              <h4 className="text-xl font-bold mb-2">Automated High-Frequency Liquidity</h4>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Our ultra-low latency matching engine ensures orders are executed in under 2ms, securing the best market prices with minimal slippage.
              </p>
              <img
                src="https://images.ctfassets.net/o10es7wu5gm1/NwN4qP0kizrOvWSJm9fhC/900e0f0eb28c040f6bcafb74cdf4f4a8/Group_1547769260__1_.png"
                alt="crypto dashboard mockup"
                className="w-full object-contain filter drop-shadow-2xl rounded-2xl group-hover:scale-102 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM STATISTICS SECTION */}
      <section className="relative px-6 md:px-12 lg:px-20 py-16 bg-white/2 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: "24h Trading Volume", val: "₹18,452 Cr+", desc: "$2.2B USD matched daily" },
              { label: "Verified Users", val: "1.2 Cr+", desc: "Globally active investors" },
              { label: "System matching latency", val: "< 1.5ms", desc: "Ultra-low slippage engine" },
              { label: "Vault Security Reserve", val: "100% backed", desc: "Proof of reserves certified" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center md:text-left border-l border-white/10 pl-6 first:border-0">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 font-medium">{stat.label}</p>
                <p className="text-2xl md:text-3xl font-extrabold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{stat.val}</p>
                <p className="text-gray-400 text-xs mt-1">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="px-6 md:px-12 lg:px-20 py-24 bg-white/1 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
            The Most Secure & Trusted <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Digital Exchange Ecosystem
            </span>
          </h2>

          <p className="text-gray-400 text-base md:text-lg max-w-3xl mx-auto mt-6 leading-relaxed">
            Millions of institutional and retail traders depend on our state-of-the-art blockchain infrastructure for military-grade protection and instant fiat-to-crypto settlements.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[
              {
                icon: <FaShieldAlt />,
                title: "Bank-Grade Encryption",
                desc: "All wallets utilize advanced multi-signature configurations and HSM key storage, protecting your assets against breach vectors."
              },
              {
                icon: <FaChartLine />,
                title: "Professional Indicators",
                desc: "Monitor custom orderbooks, depth graphs, and candlestick charts in real time, built directly into a latency-optimized web dashboard."
              },
              {
                icon: <FaGlobe />,
                title: "Cross-Border Liquidity",
                desc: "Experience instantaneous arbitrage across global markets with deep liquidity pools connected to top-tier institutional providers."
              }
            ].map((feat, idx) => (
              <div key={idx} className="bg-white/3 border border-white/8 rounded-3xl p-8 hover:border-cyan-400/40 hover:-translate-y-1 transition-all duration-300 backdrop-blur-md">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 text-2xl mx-auto mb-6 shadow-md">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">
                  {feat.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DETAILED INFORMATION AND VALUE PROP SECTION */}
      <section className="px-6 md:px-12 lg:px-20 py-24 bg-transparent border-t border-white/5">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full"></div>
            <div className="relative grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-md">
                  <FaServer className="text-3xl text-cyan-400 mx-auto mb-3" />
                  <p className="font-bold text-white text-base">Uptime Guarantee</p>
                  <p className="text-xs text-gray-500 mt-1">99.99% operational SLA</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-md">
                  <FaLock className="text-3xl text-cyan-400 mx-auto mb-3" />
                  <p className="font-bold text-white text-base">Cold Storage Vaults</p>
                  <p className="text-xs text-gray-500 mt-1">98% of reserves offline</p>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-md">
                  <FaUsers className="text-3xl text-cyan-400 mx-auto mb-3" />
                  <p className="font-bold text-white text-base">Dedicated OTC Desk</p>
                  <p className="text-xs text-gray-500 mt-1">For large volume settlements</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-md">
                  <FaDatabase className="text-3xl text-cyan-400 mx-auto mb-3" />
                  <p className="font-bold text-white text-base">Public Auditing</p>
                  <p className="text-xs text-gray-500 mt-1">Real-time assets ledger</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
              Empowering High-Performance <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Trading Operations
              </span>
            </h2>

            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6">
              Our advanced software layer is engineered for professional traders, market makers, and institutional asset managers. CryptoX brings together high-speed execution engines and deep liquidity pools with structural compliance.
            </p>

            <div className="space-y-4">
              {[
                { title: "Institutional APIs", text: "Low-latency REST, WebSocket, and FIX connectivity for automated algorithmic trading systems." },
                { title: "Direct Fiat Rails", text: "Deposit and withdraw funds instantly with direct UPI, IMPS, and net banking support with 0% gateway fees." },
                { title: "Regulatory Conformance", text: "Compliant transaction logging, strict AML controls, and full data residency parameters." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-1">
                    <FaChevronRight className="text-[8px]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm md:text-base">{item.title}</h4>
                    <p className="text-gray-500 text-xs md:text-sm mt-1">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CARDS SECTION (EXPLORE ASSETS) */}
      <section className="px-6 md:px-12 lg:px-20 py-24 bg-white/2 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold">
              Explore Digital Assets
            </h2>

            <p className="text-gray-400 mt-4 text-base md:text-lg">
              Explore key indicators and trust protocols built into our platform architecture.
            </p>
          </div>

          <CryptoCards />
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="px-6 md:px-12 lg:px-20 py-24">
        <div className="max-w-6xl mx-auto text-center bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-[40px] p-10 md:p-16 relative overflow-hidden backdrop-blur-md">
          {/* Subtle backgrounds */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-400/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight relative z-10">
            Ready To Upgrade Your <br />
            Investment Strategy?
          </h2>

          <p className="text-gray-300 text-sm md:text-lg leading-relaxed max-w-3xl mx-auto mt-6 relative z-10">
            Create an account within minutes, perform instant security verification, deposit funds, and start trading digital currencies with institutional safeguards.
          </p>

          <div className="relative z-10">
            <Link
              to="/graph"
              className="inline-flex items-center gap-2 mt-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 px-10 py-4 rounded-2xl font-bold shadow-lg shadow-cyan-500/20 cursor-pointer transform hover:-translate-y-0.5"
            >
              Start Trading Now
              <FaArrowRight className="text-sm" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;