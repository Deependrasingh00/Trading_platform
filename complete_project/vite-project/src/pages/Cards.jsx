import React from "react";
import {
  FaGlobe,
  FaShieldAlt,
  FaBuilding,
  FaMagic,
  FaArrowRight,
} from "react-icons/fa";

const cards = [
  {
    id: 1,
    title: "The largest public crypto standard",
    description:
      "CryptoX operates with absolute financial transparency, conforming to strict security standards. That means we run our operations with regular disclosures.",
    icon: <FaGlobe className="text-cyan-400 text-2xl" />,
  },
  {
    id: 2,
    title: "Your assets are secure",
    description:
      "Your crypto is your crypto. CryptoX doesn't use or lend your assets without your explicit permission, and we offer advanced cryptographic security protocols.",
    icon: <FaShieldAlt className="text-cyan-400 text-2xl" />,
  },
  {
    id: 3,
    title: "Trusted by millions",
    description:
      "Millions of institutional and retail users trust our secure platform for buying, selling, staking, and storing digital assets with ease and confidence.",
    icon: <FaBuilding className="text-cyan-400 text-2xl" />,
  },
  {
    id: 4,
    title: "Simple & powerful tools",
    description:
      "Access intuitive crypto trading tools, custom market indicators, and real-time ledger auditing designed for both beginners and professionals.",
    icon: <FaMagic className="text-cyan-400 text-2xl" />,
  },
];

const CryptoCards = () => {
  return (
    <section className="w-full py-6 bg-transparent">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <div
            key={card.id}
            className="
              bg-white/5
              border
              border-white/10
              rounded-3xl
              p-6
              min-h-[200px]
              flex
              flex-col
              justify-between
              hover:border-cyan-400/40
              hover:-translate-y-1.5
              hover:shadow-[0_10px_30px_rgba(6,182,212,0.1)]
              transition-all
              duration-300
              backdrop-blur-md
            "
          >
            {/* Header / Icon */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center shadow-inner">
                {card.icon}
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white tracking-wide leading-snug">
                {card.title}
              </h3>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-sm leading-relaxed mt-4 flex-grow">
              {card.description}
            </p>

            {/* Button */}
            <div className="mt-6">
              <button
                className="
                  bg-white/5
                  border
                  border-white/15
                  text-cyan-400
                  hover:text-white
                  hover:bg-cyan-500
                  hover:border-cyan-400
                  px-4
                  py-2
                  rounded-xl
                  flex
                  items-center
                  gap-2
                  font-semibold
                  text-xs
                  transition-all
                  duration-300
                  cursor-pointer
                "
              >
                Learn More
                <FaArrowRight className="text-[10px]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CryptoCards;