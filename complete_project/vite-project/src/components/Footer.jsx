import React from "react";
import {
  FaBitcoin,
  FaTwitter,
  FaInstagram,
  
} from "react-icons/fa";

const Footer = () => {
  const footerLinks = {
    Platform: ["Markets", "Exchange", "Wallet", "Trading"],
    Company: ["About", "Careers", "Blog", "Press"],
    Resources: ["API", "Documentation", "Developers", "Support"],
    Legal: ["Privacy", "Terms", "Security", "Licenses"],
  };

  return (
    <footer className="bg-[#0B1120] text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-20 py-20">
        
        {/* TOP */}
        <div className="grid lg:grid-cols-2 gap-16 border-b border-white/10 pb-14">
          
          {/* LEFT */}
          <div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/20 flex items-center justify-center">
                <FaBitcoin className="text-cyan-400 text-3xl" />
              </div>

              <div>
                <h2 className="text-3xl font-bold">
                  CryptoX
                </h2>

                <p className="text-gray-400">
                  Future Of Finance
                </p>
              </div>
            </div>

            <p className="text-gray-400 leading-8 mt-8 max-w-lg">
              Secure cryptocurrency trading platform for modern investors and
              traders worldwide. Experience the future of digital finance.
            </p>

            {/* SOCIAL */}
            <div className="flex items-center gap-4 mt-8">
              {[FaTwitter, FaInstagram].map(
                (Icon, index) => (
                  <div
                    key={index}
                    className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-cyan-400 hover:text-cyan-400 transition-all duration-300 cursor-pointer"
                  >
                    <Icon className="text-lg" />
                  </div>
                )
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {Object.entries(footerLinks).map(([title, items]) => (
              <div key={title}>
                <h3 className="text-xl font-semibold mb-5">
                  {title}
                </h3>

                <ul className="space-y-4">
                  {items.map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-cyan-400 transition-all duration-300"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-5 pt-8">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} CryptoX. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-sm">
            <a
              href="#"
              className="text-gray-500 hover:text-cyan-400 transition-all duration-300"
            >
              Privacy Policy
            </a>

            <a
              href="#"
              className="text-gray-500 hover:text-cyan-400 transition-all duration-300"
            >
              Terms
            </a>

            <a
              href="#"
              className="text-gray-500 hover:text-cyan-400 transition-all duration-300"
            >
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;