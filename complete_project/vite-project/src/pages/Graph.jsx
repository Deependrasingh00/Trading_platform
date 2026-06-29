import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import {
  FaBitcoin, FaArrowUp, FaArrowDown, FaChartLine,
  FaGlobe, FaCoins, FaFire, FaBolt,
} from "react-icons/fa";

// Live order book fake data generator
const genOrder = (basePrice, side) => {
  const spread = side === "buy" ? -1 : 1;
  const price = (basePrice + spread * Math.random() * 200).toFixed(2);
  const qty = (Math.random() * 2).toFixed(4);
  return { price, qty, total: (price * qty).toFixed(2) };
};

const COINS = [
  { id: "bitcoin",  symbol: "BTC", name: "Bitcoin",  color: "#F7931A" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", color: "#627EEA" },
  { id: "solana",   symbol: "SOL", name: "Solana",   color: "#9945FF" },
  { id: "ripple",   symbol: "XRP", name: "XRP",      color: "#346AA9" },
];

export default function Graph() {
  const [prices, setPrices]       = useState({});
  const [chartData, setChartData] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState("bitcoin");
  const [marketData, setMarketData]     = useState(null);
  const [topMovers, setTopMovers]       = useState([]);
  const [orderBook, setOrderBook]       = useState({ buys: [], sells: [] });
  const [trades, setTrades]             = useState([]);
  const [livePrice, setLivePrice]       = useState(null);
  const [priceDir, setPriceDir]         = useState("up");
  const prevPrice = useRef(null);
  const tradesRef = useRef([]);

  const userEmail = localStorage.getItem("userEmail") || "demo@cryptox.com";

  // Simulated Portfolio state
  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem(`portfolio_${userEmail}`);
    if (saved) return JSON.parse(saved);
    return {
      usd: 10000,
      btc: 0,
      eth: 0,
      sol: 0,
      xrp: 0
    };
  });

  const [tradeType, setTradeType] = useState("buy");
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeCoin, setTradeCoin] = useState("bitcoin");
  const [tradeMsg, setTradeMsg] = useState({ text: "", type: "" });

  // Save portfolio to localStorage
  useEffect(() => {
    localStorage.setItem(`portfolio_${userEmail}`, JSON.stringify(portfolio));
  }, [portfolio, userEmail]);

  const handleTrade = (e) => {
    e.preventDefault();
    const amt = parseFloat(tradeAmount);
    if (isNaN(amt) || amt <= 0) {
      setTradeMsg({ text: "Please enter a valid amount", type: "error" });
      return;
    }

    const coinPrice = prices[tradeCoin]?.usd || livePrice || 1;
    const coinSymbol = COINS.find(c => c.id === tradeCoin)?.symbol.toLowerCase();

    if (tradeType === "buy") {
      if (amt > portfolio.usd) {
        setTradeMsg({ text: "Insufficient USD balance to buy!", type: "error" });
        return;
      }
      const quantity = amt / coinPrice;
      setPortfolio(prev => ({
        ...prev,
        usd: Number((prev.usd - amt).toFixed(2)),
        [coinSymbol]: Number((prev[coinSymbol] + quantity).toFixed(6))
      }));
      setTradeMsg({ text: `Success! Bought ${quantity.toFixed(4)} ${coinSymbol.toUpperCase()}`, type: "success" });
    } else {
      const coinHolding = portfolio[coinSymbol] || 0;
      const coinValue = coinHolding * coinPrice;
      if (amt > coinValue) {
        setTradeMsg({ text: `Insufficient holdings! You only have $${coinValue.toFixed(2)} worth of ${coinSymbol.toUpperCase()}`, type: "error" });
        return;
      }
      const quantity = amt / coinPrice;
      setPortfolio(prev => ({
        ...prev,
        usd: Number((prev.usd + amt).toFixed(2)),
        [coinSymbol]: Number((prev[coinSymbol] - quantity).toFixed(6))
      }));
      setTradeMsg({ text: `Success! Sold ${quantity.toFixed(4)} ${coinSymbol.toUpperCase()}`, type: "success" });
    }
    setTradeAmount("");
    setTimeout(() => setTradeMsg({ text: "", type: "" }), 4000);
  };

  // ── Fetch prices for ticker bar ──────────────────────────────────────────
  const fetchPrices = async () => {
    try {
      const ids = COINS.map(c => c.id).join(",");
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      );
      setPrices(res.data);
    } catch (_) {}
  };

  // ── Fetch market global data ──────────────────────────────────────────────
  const fetchMarket = async () => {
    try {
      const res = await axios.get("https://api.coingecko.com/api/v3/global");
      setMarketData(res.data.data);
    } catch (_) {}
  };

  // ── Fetch top movers ──────────────────────────────────────────────────────
  const fetchMovers = async () => {
    try {
      const res = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
        params: { vs_currency: "usd", order: "market_cap_desc", per_page: 8, page: 1, sparkline: false },
      });
      setTopMovers(res.data);
    } catch (_) {}
  };

  // ── Fetch chart for selected coin ─────────────────────────────────────────
  const fetchChart = async (coinId) => {
    try {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
        { params: { vs_currency: "usd", days: 1 } }
      );
      const pts = res.data.prices;
      const latestPrice = pts[pts.length - 1][1];
      setLivePrice(latestPrice);
      if (prevPrice.current !== null) {
        setPriceDir(latestPrice >= prevPrice.current ? "up" : "down");
      }
      prevPrice.current = latestPrice;

      setChartData({
        labels: pts.map(p => {
          const d = new Date(p[0]);
          return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
        }),
        datasets: [{
          label: coinId.toUpperCase(),
          data: pts.map(p => p[1]),
          borderColor: COINS.find(c => c.id === coinId)?.color || "#06B6D4",
          backgroundColor: "transparent",
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
        }],
      });
    } catch (_) {}
  };

  // ── Simulate live order book ──────────────────────────────────────────────
  const updateOrderBook = () => {
    const base = prevPrice.current || 65000;
    setOrderBook({
      buys:  Array.from({ length: 8 }, () => genOrder(base, "buy")),
      sells: Array.from({ length: 8 }, () => genOrder(base, "sell")),
    });
  };

  // ── Simulate live trades feed ─────────────────────────────────────────────
  const addTrade = () => {
    const base = prevPrice.current || 65000;
    const side = Math.random() > 0.5 ? "buy" : "sell";
    const price = (base + (side === "buy" ? -1 : 1) * Math.random() * 150).toFixed(2);
    const qty   = (Math.random() * 0.5 + 0.001).toFixed(4);
    const newTrade = {
      id: Date.now(),
      side,
      price,
      qty,
      time: new Date().toLocaleTimeString(),
    };
    tradesRef.current = [newTrade, ...tradesRef.current.slice(0, 19)];
    setTrades([...tradesRef.current]);
  };

  useEffect(() => {
    fetchPrices();
    fetchMarket();
    fetchMovers();
    fetchChart(selectedCoin);

    const priceInterval  = setInterval(fetchPrices, 30000);
    const chartInterval  = setInterval(() => fetchChart(selectedCoin), 30000);
    const orderInterval  = setInterval(updateOrderBook, 1200);
    const tradeInterval  = setInterval(addTrade, 800);

    return () => {
      clearInterval(priceInterval);
      clearInterval(chartInterval);
      clearInterval(orderInterval);
      clearInterval(tradeInterval);
    };
  }, [selectedCoin]);

  const coin = COINS.find(c => c.id === selectedCoin);

  return (
    <div className="bg-[#020817] text-white min-h-screen overflow-hidden">

      {/* ── Ticker Bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white/3 border-b border-white/10 overflow-hidden py-2">
        <div className="flex gap-10 px-6 overflow-x-auto scrollbar-hide whitespace-nowrap">
          {COINS.map(c => {
            const d = prices[c.id];
            const change = d?.usd_24h_change;
            return (
              <div key={c.id} className="flex items-center gap-3 shrink-0">
                <span className="text-gray-400 text-sm font-semibold">{c.symbol}/USDT</span>
                <span className="text-white font-bold">
                  ${d?.usd?.toLocaleString() || "—"}
                </span>
                {change !== undefined && (
                  <span className={`text-xs font-semibold flex items-center gap-1 ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {change >= 0 ? <FaArrowUp className="text-[10px]" /> : <FaArrowDown className="text-[10px]" />}
                    {Math.abs(change).toFixed(2)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 max-w-400 mx-auto">

        {/* ── Market Stats ──────────────────────────────────────────────────── */}
        {marketData && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { icon: FaGlobe,      label: "Market Cap",    value: `$${(marketData.total_market_cap.usd / 1e12).toFixed(2)}T`, color: "cyan" },
              { icon: FaCoins,      label: "24h Volume",    value: `$${(marketData.total_volume.usd   / 1e9).toFixed(1)}B`,   color: "blue" },
              { icon: FaBitcoin,    label: "BTC Dominance", value: `${marketData.market_cap_percentage.btc.toFixed(1)}%`,     color: "yellow" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className={`bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3`}>
                <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 border border-${color}-400/20 flex items-center justify-center text-${color}-400`}>
                  <Icon />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className={`text-${color}-400 font-bold text-lg`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Main Trading Area ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-4">

          {/* Order Book - Left */}
          <div className="col-span-12 lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-gray-300">
              <FaBolt className="text-yellow-400 text-xs" /> Order Book
            </h3>
            <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
              <span>Price</span><span>Qty</span>
            </div>
            {/* Sells - red */}
            <div className="space-y-0.5 mb-2">
              {orderBook.sells.slice().reverse().map((o, i) => (
                <div key={i} className="flex justify-between text-xs py-0.5 px-1 rounded relative overflow-hidden group">
                  <div className="absolute inset-y-0 right-0 bg-red-500/10 transition-all" style={{ width: `${Math.min(100, o.qty * 100)}%` }} />
                  <span className="text-red-400 relative z-10">{Number(o.price).toLocaleString()}</span>
                  <span className="text-gray-400 relative z-10">{o.qty}</span>
                </div>
              ))}
            </div>
            {/* Mid price */}
            <div className={`text-center py-1.5 font-bold text-sm mb-2 rounded-lg ${priceDir === "up" ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
              {livePrice ? `$${Number(livePrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
              {priceDir === "up" ? " ▲" : " ▼"}
            </div>
            {/* Buys - green */}
            <div className="space-y-0.5">
              {orderBook.buys.map((o, i) => (
                <div key={i} className="flex justify-between text-xs py-0.5 px-1 rounded relative overflow-hidden">
                  <div className="absolute inset-y-0 right-0 bg-green-500/10" style={{ width: `${Math.min(100, o.qty * 100)}%` }} />
                  <span className="text-green-400 relative z-10">{Number(o.price).toLocaleString()}</span>
                  <span className="text-gray-400 relative z-10">{o.qty}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart - Center */}
          <div className="col-span-12 lg:col-span-8 bg-white/5 border border-white/10 rounded-2xl p-5">
            {/* Coin selector */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {COINS.map(c => (
                    <button key={c.id} onClick={() => setSelectedCoin(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedCoin === c.id
                          ? "text-white border"
                          : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
                      }`}
                      style={selectedCoin === c.id ? { background: c.color + "20", borderColor: c.color + "60", color: c.color } : {}}>
                      {c.symbol}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className={`text-2xl font-bold ${priceDir === "up" ? "text-green-400" : "text-red-400"}`}>
                    ${livePrice ? Number(livePrice).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                  </span>
                  {priceDir === "up"
                    ? <FaArrowUp className="text-green-400" />
                    : <FaArrowDown className="text-red-400" />}
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-400/10 border border-green-400/20 px-3 py-1.5 rounded-xl">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-xs font-semibold">LIVE</span>
              </div>
            </div>

            {/* Chart */}
            <div className="h-72">
              {chartData ? (
                <Line data={chartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: { duration: 300 },
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#6B7280", maxTicksLimit: 8, font: { size: 10 } } },
                    y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#6B7280", font: { size: 10 } } },
                  },
                }} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Loading chart...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Top movers below chart */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <FaFire className="text-orange-400" /> Top Coins
              </p>
              <div className="grid grid-cols-4 gap-3">
                {topMovers.slice(0, 4).map(coin => (
                  <div key={coin.id} className="bg-white/3 border border-white/10 rounded-xl p-3 flex items-center gap-2">
                    <img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{coin.symbol.toUpperCase()}</p>
                      <p className={`text-xs font-semibold ${coin.price_change_percentage_24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {coin.price_change_percentage_24h >= 0 ? "+" : ""}{coin.price_change_percentage_24h?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Trades - Right */}
          <div className="col-span-12 lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-gray-300">
              <FaChartLine className="text-cyan-400 text-xs" /> Live Trades
            </h3>
            <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
              <span>Price</span><span>Qty</span>
            </div>
            <div className="space-y-0.5 overflow-hidden max-h-105">
              {trades.map((t, i) => (
                <div key={t.id}
                  className={`flex justify-between text-xs py-1 px-1 rounded transition-all ${
                    i === 0 ? (t.side === "buy" ? "bg-green-500/20" : "bg-red-500/20") : ""
                  }`}>
                  <span className={t.side === "buy" ? "text-green-400" : "text-red-400"}>
                    {Number(t.price).toLocaleString()}
                  </span>
                  <span className="text-gray-400">{t.qty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Simulated Trading & Portfolio ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Trading Form */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative backdrop-blur-md">
            <h3 className="text-sm font-bold mb-4 text-gray-300 flex items-center gap-2">
              <FaCoins className="text-cyan-400" /> Simulated Spot Trading
            </h3>
            
            {tradeMsg.text && (
              <div className={`mb-4 p-3 rounded-xl border text-xs font-semibold text-center ${
                tradeMsg.type === "success" 
                  ? "bg-green-500/10 border-green-400/20 text-green-400" 
                  : "bg-red-500/10 border-red-400/20 text-red-400"
              }`}>
                {tradeMsg.text}
              </div>
            )}

            <form onSubmit={handleTrade} className="space-y-4">
              {/* Buy / Sell Toggles */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setTradeType("buy")}
                  className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tradeType === "buy"
                      ? "bg-green-500 text-white shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setTradeType("sell")}
                  className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tradeType === "sell"
                      ? "bg-red-500 text-white shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  SELL
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Coin Dropdown */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Asset</label>
                  <select
                    value={tradeCoin}
                    onChange={e => setTradeCoin(e.target.value)}
                    className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-400/50 outline-none cursor-pointer font-semibold"
                  >
                    {COINS.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#020817]">
                        {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount in USD */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Amount (USD)</label>
                  <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-xl px-4 py-2.5 transition-all">
                    <span className="text-gray-600 text-xs">$</span>
                    <input
                      type="number"
                      value={tradeAmount}
                      onChange={e => setTradeAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="bg-transparent outline-none w-full ml-2 text-white placeholder-gray-700 text-sm animate-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md mt-2 cursor-pointer ${
                  tradeType === "buy"
                    ? "bg-green-500 hover:bg-green-400 shadow-green-500/10 text-white"
                    : "bg-red-500 hover:bg-red-400 shadow-red-500/10 text-white"
                }`}
              >
                Execute {tradeType.toUpperCase()} Order
              </button>
            </form>
          </div>

          {/* Portfolio Dashboard */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <FaChartLine className="text-cyan-400" /> Your Simulated Portfolio
              </h3>
              <button
                onClick={() => {
                  if (window.confirm("Reset portfolio back to $10,000 USD?")) {
                    setPortfolio({ usd: 10000, btc: 0, eth: 0, sol: 0, xrp: 0 });
                  }
                }}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
              >
                Reset Balance
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Simulated Cash</p>
                <p className="text-lg font-black text-white mt-1">${portfolio.usd.toLocaleString()}</p>
              </div>
              <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Total Portfolio Value</p>
                <p className="text-lg font-black text-cyan-400 mt-1">
                  ${(
                    portfolio.usd +
                    portfolio.btc * (prices.bitcoin?.usd || 0) +
                    portfolio.eth * (prices.ethereum?.usd || 0) +
                    portfolio.sol * (prices.solana?.usd || 0) +
                    portfolio.xrp * (prices.ripple?.usd || 0)
                  ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto custom-scroll pr-1">
              {[
                { sym: "BTC", name: "Bitcoin", amt: portfolio.btc, price: prices.bitcoin?.usd || 0, color: "text-orange-400" },
                { sym: "ETH", name: "Ethereum", amt: portfolio.eth, price: prices.ethereum?.usd || 0, color: "text-blue-400" },
                { sym: "SOL", name: "Solana", amt: portfolio.sol, price: prices.solana?.usd || 0, color: "text-purple-400" },
                { sym: "XRP", name: "Ripple", amt: portfolio.xrp, price: prices.ripple?.usd || 0, color: "text-cyan-400" },
              ].map(asset => {
                const value = asset.amt * asset.price;
                return (
                  <div key={asset.sym} className="flex justify-between items-center bg-white/2 border border-white/5 rounded-xl px-4 py-2 text-xs">
                    <div>
                      <span className={`font-bold ${asset.color}`}>{asset.sym}</span>
                      <span className="text-gray-500 ml-2">{asset.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{asset.amt.toFixed(4)} {asset.sym}</p>
                      <p className="text-[10px] text-gray-500">${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Bottom: All Top Movers ─────────────────────────────────────────── */}
        <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-bold mb-4 text-gray-300 flex items-center gap-2">
            <FaFire className="text-orange-400" /> Market Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {topMovers.map(coin => (
              <div key={coin.id} className="bg-white/3 border border-white/10 hover:border-white/20 rounded-xl p-3 transition-all cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                  <span className="text-xs font-bold">{coin.symbol.toUpperCase()}</span>
                </div>
                <p className="text-white text-xs font-semibold">${coin.current_price?.toLocaleString()}</p>
                <p className={`text-xs font-semibold mt-0.5 ${coin.price_change_percentage_24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {coin.price_change_percentage_24h >= 0 ? "+" : ""}{coin.price_change_percentage_24h?.toFixed(2)}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── New Bottom Content: Fear & Greed Index & Market News ─────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pb-10">
          
          {/* Sentiment Gauge */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold mb-4 text-gray-300 flex items-center gap-2">
                <FaBolt className="text-yellow-400" /> Market Sentiment
              </h3>
              <p className="text-xs text-gray-500 mb-6">Real-time aggregate retail and institutional trading sentiment score.</p>
              
              <div className="flex flex-col items-center">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-8 border-white/5 border-t-cyan-500/50 border-r-cyan-500/50 animate-spin" style={{ animationDuration: '6s' }} />
                  <div className="absolute inset-2 rounded-full border-8 border-white/5 border-b-emerald-500/50 border-l-emerald-500/50" />
                  <div className="text-center relative z-10">
                    <p className="text-4xl font-extrabold text-cyan-400">76</p>
                    <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider mt-1">Extreme Greed</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between text-xs text-gray-500 border-t border-white/5 pt-4">
              <span>Yesterday: 74 (Greed)</span>
              <span>Last week: 69 (Greed)</span>
            </div>
          </div>

          {/* Live News Feed */}
          <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-bold mb-4 text-gray-300 flex items-center gap-2">
              <FaGlobe className="text-cyan-400" /> Live Market News & Insights
            </h3>
            
            <div className="space-y-4 max-h-50 overflow-y-auto pr-2 custom-scroll">
              {[
                { title: "Bitcoin Breaks Above $67,000 as Institutional Inflow Surges", source: "CoinNews · 10m ago", tag: "BTC", bullet: "🟢" },
                { title: "Ethereum Gas Fees Drop to Multi-Year Low Following Layer 2 Adoption", source: "CryptoGlobal · 45m ago", tag: "ETH", bullet: "🔵" },
                { title: "NVIDIA Stock Reaches New Record High as AI Hardware Demand Expands", source: "StockTick · 2h ago", tag: "NVDA", bullet: "🟢" },
                { title: "Solana Network Active Addresses Reach All-Time High Amid Dex Volume Boost", source: "SolFeed · 4h ago", tag: "SOL", bullet: "🟣" },
                { title: "Federal Reserve Hints at Possible Rate Cuts in Q3 Financial Report", source: "FinTimes · 6h ago", tag: "Macro", bullet: "⚪" },
              ].map((news, idx) => (
                <div key={idx} className="flex gap-3 items-start border-b border-white/5 pb-3 last:border-b-0 last:pb-0 hover:bg-white/3 p-2 rounded-xl transition-all">
                  <span className="text-sm shrink-0">{news.bullet}</span>
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-white leading-relaxed">{news.title}</h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-gray-500">{news.source}</span>
                      <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-400/20 px-1.5 py-0.5 rounded">
                        #{news.tag}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
