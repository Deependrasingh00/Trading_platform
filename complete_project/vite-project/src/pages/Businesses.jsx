import React from "react";
import {
  FaChartLine,
  FaShieldAlt,
  FaGlobe,
  FaArrowRight,
  FaBitcoin,
  FaBuilding,
  FaKey,
  FaFileContract,
  FaCheckCircle,
} from "react-icons/fa";
import { Link } from "react-router-dom";

function Businesses() {
  const services = [
    {
      title: "Global Liquidity Gates",
      description:
        "Accept multi-asset digital payments globally with absolute network security and instantaneous conversion into domestic currencies.",
      icon: <FaBitcoin className="text-cyan-400" />,
    },
    {
      title: "Enterprise Cold Storage",
      description:
        "Protect business capital with hardware security modules (HSMs) and institutional multi-signature authentication layers.",
      icon: <FaShieldAlt className="text-cyan-400" />,
    },
    {
      title: "Arbitrage Execution",
      description:
        "Scale commercial cash flows across cross-border settlement rails backed by deep market-maker integrations.",
      icon: <FaGlobe className="text-cyan-400" />,
    },
  ];

  const businessSolutions = [
    {
      title: "Institutional Custody Desk",
      description:
        "Tailored for corporate balance sheets, high-net-worth individuals, and hedge funds requiring regulated custody with customized authorization rules.",
      image:
        "https://images.unsplash.com/photo-1559526324-593bc073d938?q=80&w=1200&auto=format&fit=crop",
    },
    {
      title: "Corporate Treasuries Wallet",
      description:
        "Automated payout channels, multi-role employee permissions, and programmatic ledger audits integrated with standard enterprise accounting ERP systems.",
      image:
        "https://images.unsplash.com/photo-1639762681057-408e52192e55?q=80&w=1200&auto=format&fit=crop",
    },
    {
      title: "Custom Blockchain APIs",
      description:
        "Build, deploy, and scale proprietary algorithms using our lightning-fast WebSocket and REST API architecture. Sub-millisecond tick responses.",
      image:
        "https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  return (
    <div className="bg-[#020817] text-white overflow-hidden font-sans">
      {/* HERO SECTION */}
      <section className="relative px-6 md:px-10 lg:px-20 pt-24 pb-24">
        {/* Glow Spheres */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 text-cyan-400 text-xs font-semibold mb-8 tracking-wider uppercase animate-pulse">
            <FaBuilding className="text-xs" />
            Enterprise Solutions & Compliance
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-none tracking-tight">
            Institutional Crypto <br />
            Infrastructure for <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Fintechs.</span>
          </h1>

          <p className="text-gray-400 text-lg mt-8 max-w-3xl mx-auto leading-relaxed">
            CryptoX delivers reliable APIs, custodian wallets, and global OTC liquidity desks. Our systems are engineered to help startups, brokerages, and corporations deploy digital assets services securely and compliantly.
          </p>
          
          <div className="mt-10">
            <Link to="/deposit">
              <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-cyan-500/20 transform hover:-translate-y-0.5 cursor-pointer">
                Establish Corporate Account
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section className="px-6 md:px-10 lg:px-20 pb-24 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white/3 border border-white/8 rounded-3xl p-8 backdrop-blur-md hover:border-cyan-400/40 hover:-translate-y-1.5 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-2xl mb-6 shadow-inner">
                {service.icon}
              </div>

              <h2 className="text-xl font-bold mb-4">
                {service.title}
              </h2>

              <p className="text-gray-400 text-sm leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPLIANCE & SECURITY DETAILS SECTION */}
      <section className="px-6 md:px-10 lg:px-20 py-16 bg-white/2 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
                Regulated Security & Compliance Framework
              </h2>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8">
                CryptoX implements rigorous compliance monitoring, structural data encryption parameters, and regular security reserves audits. We build systems that satisfy high banking standards.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: <FaKey />, title: "HSM Cold Vaults", desc: "Private key material is held offline in custom geographic sites." },
                  { icon: <FaFileContract />, title: "Full Transaction Logs", desc: "Real-time auditing files matching international standards." },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/20 text-cyan-400 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm md:text-base">{item.title}</h4>
                      <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-3xl p-8 backdrop-blur-md">
              <h3 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-4">Our Integrity Parameters</h3>
              <div className="space-y-4">
                {[
                  "100% Full Proof of Reserves - Assets are backed 1:1 in secure cold custody",
                  "Multi-Signature Authorization rules customized per corporate account level",
                  "Hardware Security Module (HSM) isolation for automatic transaction signing",
                  "Soc2 Type II and ISO-27001 cybersecurity frameworks aligned system configurations",
                ].map((check, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <FaCheckCircle className="text-cyan-400 shrink-0 mt-1 text-sm" />
                    <p className="text-gray-300 text-xs md:text-sm leading-relaxed">{check}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTIONS PORTFOLIO */}
      <section className="px-6 md:px-10 lg:px-20 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold">
              Dedicated Portfolio Options
            </h2>

            <p className="text-gray-400 mt-5 text-base md:text-lg">
              Engineered solutions crafted for modern financial organizations, startups, and brokerages.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {businessSolutions.map((item, index) => (
              <div
                key={index}
                className="bg-white/3 border border-white/8 rounded-3xl overflow-hidden backdrop-blur-md hover:border-cyan-400/30 transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-all duration-500 filter brightness-90 group-hover:brightness-100"
                  />
                </div>

                <div className="p-8">
                  <h3 className="text-xl font-bold mb-4 text-white">
                    {item.title}
                  </h3>

                  <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                    {item.description}
                  </p>

                  <button className="mt-6 flex items-center gap-3 text-cyan-400 hover:gap-4 transition-all duration-300 text-xs font-semibold uppercase tracking-wider cursor-pointer">
                    Examine Service
                    <FaArrowRight className="text-[10px]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="px-6 md:px-10 lg:px-20 pb-28">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-[40px] p-10 md:p-16 text-center backdrop-blur-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-400/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight relative z-10">
            Ready To Upgrade Your <br />
            Business Treasury?
          </h2>

          <p className="text-gray-400 text-base md:text-lg mt-6 max-w-3xl mx-auto leading-relaxed relative z-10">
            Join thousands of modern brokerages and corporate entities using CryptoX to scale their treasury management parameters.
          </p>
          
          <div className="relative z-10">
            <Link to="/home">
              <button className="mt-10 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-cyan-500/20 cursor-pointer transform hover:-translate-y-0.5">
                Explore Dashboard
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Businesses;