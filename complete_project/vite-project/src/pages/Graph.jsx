import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import {
  FaBitcoin, FaArrowUp, FaArrowDown, FaChartLine,
  FaGlobe, FaCoins, FaFire, FaBolt, FaRupeeSign,
  FaCheckCircle, FaClock, FaExclamationTriangle
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

const crosshairPlugin = {
  id: "crosshair",
  afterDraw: (chart) => {
    if (chart.tooltip?._active && chart.tooltip._active.length) {
      const activePoint = chart.tooltip._active[0];
      const ctx = chart.ctx;
      const x = activePoint.element.x;
      const y = activePoint.element.y;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;
      const leftX = chart.scales.x.left;
      const rightX = chart.scales.x.right;

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;

      // Vertical line
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);

      // Horizontal line
      ctx.moveTo(leftX, y);
      ctx.lineTo(rightX, y);

      ctx.stroke();
      ctx.restore();
    }
  }
};

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

  const userEmail = localStorage.getItem("userEmail") || "";

  // Real data state
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [userTrades, setUserTrades] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const [tradeType, setTradeType] = useState("buy");
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeCoin, setTradeCoin] = useState("bitcoin");
  const [tradeMsg, setTradeMsg] = useState({ text: "", type: "" });
  const [timeframe, setTimeframe] = useState("24H"); // "1H" | "24H" | "1W" | "30D"

  const [countdown, setCountdown] = useState(null); // { minutes: number, seconds: number }
  const [showCongratulations, setShowCongratulations] = useState(null); //Completed trade object

  // Fetch statistics/balance
  const fetchUserStats = async () => {
    if (!userEmail) return;
    try {
      const [depRes, withRes, tradeRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/deposits/user/${encodeURIComponent(userEmail)}`),
        axios.get(`${API_BASE_URL}/api/withdrawals/user/${encodeURIComponent(userEmail)}`),
        axios.get(`${API_BASE_URL}/api/trades/user/${encodeURIComponent(userEmail)}`)
      ]);
      setDeposits(depRes.data);
      setWithdrawals(withRes.data);
      setUserTrades(tradeRes.data);
    } catch (err) {
      console.error("Error fetching user stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Poll stats every 5 seconds
  useEffect(() => {
    fetchUserStats();
    const interval = setInterval(fetchUserStats, 5000);
    return () => clearInterval(interval);
  }, [userEmail]);

  // Available balance logic
  const confirmedDeps = deposits.filter(d => d.status === "Confirmed");
  const totalDeposited = confirmedDeps.reduce((sum, d) => sum + d.amount, 0);
  const totalWithdrawn = withdrawals
    .filter(w => w.status === "Approved" && w.step === 4)
    .reduce((sum, w) => sum + w.amount, 0);
  const totalOngoingTradesAmount = userTrades
    .filter(t => t.status === "ongoing")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalTradeProfits = userTrades
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + (t.profitAmount || 0), 0);

  const availableBalance = totalDeposited + totalTradeProfits - totalOngoingTradesAmount - totalWithdrawn;

  // Most recent ongoing trade timer
  const ongoingTrades = userTrades.filter(t => t.status === "ongoing");
  const latestOngoingTrade = ongoingTrades[0]; // userTrades is sorted desc by createdAt in DB

  useEffect(() => {
    if (!latestOngoingTrade) {
      setCountdown(null);
      return;
    }
    const updateTimer = () => {
      const createdTime = new Date(latestOngoingTrade.createdAt).getTime();
      const endTime = createdTime + 60 * 60 * 1000; // 60 minutes
      const diff = endTime - Date.now();
      if (diff <= 0) {
        setCountdown({ minutes: 0, seconds: 0 });
        fetchUserStats();
      } else {
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ minutes: m, seconds: s });
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [latestOngoingTrade]);

  // Congratulate popup checker
  useEffect(() => {
    const unacknowledged = userTrades.find(t => t.status === "completed" && !t.acknowledged);
    if (unacknowledged && !showCongratulations) {
      setShowCongratulations(unacknowledged);
    }
  }, [userTrades]);

  // Acknowledge popup handler
  const handleAcknowledgeTrade = async (tradeId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/trades/acknowledge/${tradeId}`);
      setShowCongratulations(null);
      fetchUserStats();
    } catch (err) {
      console.error("Error acknowledging trade", err);
    }
  };

  const handleTrade = async (e) => {
    e.preventDefault();
    if (!userEmail) {
      setTradeMsg({ text: "Please log in first", type: "error" });
      return;
    }
    const amt = parseFloat(tradeAmount);
    if (isNaN(amt) || amt <= 0) {
      setTradeMsg({ text: "Please enter a valid amount", type: "error" });
      return;
    }

    if (amt > availableBalance) {
      setTradeMsg({ text: `Insufficient balance! Available balance is ₹${availableBalance.toLocaleString("en-IN")}`, type: "error" });
      return;
    }

    try {
      const coinSymbol = COINS.find(c => c.id === tradeCoin)?.symbol;
      await axios.post(`${API_BASE_URL}/api/trades`, {
        userEmail,
        amount: amt,
        coin: coinSymbol,
        type: tradeType
      });
      setTradeMsg({ text: "Trade initialized successfully!", type: "success" });
      setTradeAmount("");
      fetchUserStats();
    } catch (err) {
      setTradeMsg({ text: err.response?.data?.message || "Failed to place trade", type: "error" });
    }
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
  const fetchChart = async (coinId, tf = timeframe) => {
    try {
      let days = 1;
      if (tf === "1W") days = 7;
      else if (tf === "30D") days = 30;

      const res = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
        { params: { vs_currency: "usd", days } }
      );
      let pts = res.data.prices;
      if (tf === "1H") {
        pts = pts.slice(-12); // Last 12 data points (approx. 1 hour with 5-min intervals)
      }

      const latestPrice = pts[pts.length - 1][1];
      setLivePrice(latestPrice);
      if (prevPrice.current !== null) {
        setPriceDir(latestPrice >= prevPrice.current ? "up" : "down");
      }
      prevPrice.current = latestPrice;

      const brandColor = COINS.find(c => c.id === coinId)?.color || "#06B6D4";

      setChartData({
        labels: pts.map(p => {
          const d = new Date(p[0]);
          if (tf === "1H" || tf === "24H") {
            return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
          } else if (tf === "1W") {
            return `${d.toLocaleDateString(undefined, { weekday: "short" })} ${d.getHours()}:00`;
          } else {
            return `${d.getDate()} ${d.toLocaleDateString(undefined, { month: "short" })}`;
          }
        }),
        datasets: [{
          label: coinId.toUpperCase(),
          data: pts.map(p => p[1]),
          borderColor: brandColor,
          borderWidth: 2,
          tension: 0.2, // Smoother TradingView tension
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: brandColor,
          pointHoverBorderColor: "#FFFFFF",
          pointHoverBorderWidth: 2,
          fill: true,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return "transparent";
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, brandColor + "25"); // 14% brand color opacity
            gradient.addColorStop(1, brandColor + "00"); // 0% opacity
            return gradient;
          },
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
    fetchChart(selectedCoin, timeframe);

    const priceInterval  = setInterval(fetchPrices, 30000);
    const chartInterval  = setInterval(() => fetchChart(selectedCoin, timeframe), 30000);
    const orderInterval  = setInterval(updateOrderBook, 1200);
    const tradeInterval  = setInterval(addTrade, 800);

    return () => {
      clearInterval(priceInterval);
      clearInterval(chartInterval);
      clearInterval(orderInterval);
      clearInterval(tradeInterval);
    };
  }, [selectedCoin, timeframe]);

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

      <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">

        {/* ── Market Stats ──────────────────────────────────────────────────── */}
        {marketData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {COINS.map(c => (
                    <button key={c.id} onClick={() => setSelectedCoin(c.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedCoin === c.id
                          ? "text-white border"
                          : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
                      }`}
                      style={selectedCoin === c.id ? { background: c.color + "20", borderColor: c.color + "60", color: c.color } : {}}>
                      {c.symbol}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 sm:ml-2">
                  <span className={`text-xl sm:text-2xl font-bold ${priceDir === "up" ? "text-green-400" : "text-red-400"}`}>
                    ${livePrice ? Number(livePrice).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                  </span>
                  {priceDir === "up"
                    ? <FaArrowUp className="text-green-400" />
                    : <FaArrowDown className="text-red-400" />}
                </div>
              </div>

              {/* TradingView-style Timeline selectors */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 shrink-0 self-start sm:self-auto">
                {["1H", "24H", "1W", "30D"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      timeframe === tf
                        ? "bg-cyan-500 text-slate-950 font-black shadow shadow-cyan-500/25"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-green-400/10 border border-green-400/20 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-xs font-semibold">LIVE</span>
              </div>
            </div>

            {/* Chart */}
            <div className="h-72">
              {chartData ? (
                <Line 
                  data={chartData} 
                  plugins={[crosshairPlugin]}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 300 },
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: "#0B1120",
                        titleColor: "#94A3B8",
                        bodyColor: "#FFFFFF",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        titleFont: { size: 10, family: 'Inter, sans-serif' },
                        bodyFont: { size: 12, weight: 'bold', family: 'Inter, sans-serif' },
                        callbacks: {
                          label: (context) => ` Price: $${Number(context.raw).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: { color: "rgba(255, 255, 255, 0.04)", borderDash: [3, 3], drawTicks: false },
                        ticks: { color: "#94A3B8", maxTicksLimit: 8, font: { size: 9, family: 'Inter, sans-serif' } }
                      },
                      y: {
                        grid: { color: "rgba(255, 255, 255, 0.04)", borderDash: [3, 3], drawTicks: false },
                        ticks: {
                          color: "#94A3B8",
                          font: { size: 9, family: 'Inter, sans-serif' },
                          callback: (value) => "$" + Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
                        }
                      },
                    },
                  }} 
                />
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

        {/* ── Real Trading & Balance Portfolio ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Trading Form */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative backdrop-blur-md">
            <h3 className="text-sm font-bold mb-4 text-gray-300 flex items-center gap-2">
              <FaCoins className="text-cyan-400" /> Spot Trading
            </h3>
            
            {/* Ongoing Trade Countdown Banner */}
            {countdown && (
              <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-xl p-4 text-center space-y-2 mb-4">
                <div className="flex items-center justify-center gap-2 text-cyan-400 font-bold text-sm">
                  <FaClock className="animate-spin" style={{ animationDuration: '6s' }} /> 
                  <span>Trade is Ongoing</span>
                </div>
                <p className="text-xs text-gray-300">
                  Wait for 60 minutes. Your trade is ongoing and will complete in 60 minutes.
                </p>
                <div className="text-2xl font-black text-white tracking-widest bg-cyan-950/40 border border-cyan-800/30 rounded-lg py-2 max-w-[200px] mx-auto">
                  {String(countdown.minutes).padStart(2, "0")}:{String(countdown.seconds).padStart(2, "0")}
                </div>
              </div>
            )}

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

                {/* Amount in INR */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Amount (INR)</label>
                  <div className="flex items-center bg-[#0B1120] border border-white/10 focus-within:border-cyan-400/50 rounded-xl px-4 py-2.5 transition-all">
                    <span className="text-gray-500 text-xs">₹</span>
                    <input
                      type="number"
                      value={tradeAmount}
                      onChange={e => setTradeAmount(e.target.value)}
                      placeholder="e.g. 5000"
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

          {/* Account Balance Dashboard */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-4">
                <FaChartLine className="text-cyan-400" /> Account Balance Summary
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Tradeable Cash</p>
                  <p className="text-lg font-black text-cyan-400 mt-1">₹{availableBalance.toLocaleString("en-IN")}</p>
                </div>
                <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Active Margin</p>
                  <p className="text-lg font-black text-yellow-400 mt-1">₹{totalOngoingTradesAmount.toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-white/2 border border-white/5 rounded-xl px-4 py-2.5 flex justify-between items-center text-xs">
                  <span className="text-gray-400">Total Deposited</span>
                  <span className="font-bold text-white">₹{totalDeposited.toLocaleString("en-IN")}</span>
                </div>
                <div className="bg-white/2 border border-white/5 rounded-xl px-4 py-2.5 flex justify-between items-center text-xs">
                  <span className="text-gray-400">Trading Profit</span>
                  <span className="font-bold text-green-400">+₹{totalTradeProfits.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Recent user trades list */}
            <div>
              <p className="text-xs text-gray-400 mb-2 font-bold">Recent Trade History</p>
              {loadingStats ? (
                <p className="text-xs text-gray-500">Loading trades...</p>
              ) : userTrades.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center border border-dashed border-white/10 rounded-xl">No trade history yet.</p>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto custom-scroll pr-1">
                  {userTrades.slice(0, 4).map(trade => (
                    <div key={trade._id} className="flex justify-between items-center bg-white/2 border border-white/5 rounded-xl px-4 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase ${trade.type === "buy" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                          {trade.type}
                        </span>
                        <span className="font-bold text-white">{trade.coin}</span>
                        <span className="text-gray-500">₹{trade.amount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="text-right">
                        {trade.status === "ongoing" ? (
                          <span className="text-yellow-500 text-[10px] flex items-center gap-1 font-semibold">
                            <FaClock className="animate-spin text-[8px]" /> Ongoing
                          </span>
                        ) : (
                          <span className="text-green-400 font-bold">
                            +₹{(trade.profitAmount || 0).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* ── Congratulations Modal ───────────────────────────────────────── */}
      {showCongratulations && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-[#0B1120] border border-green-500/30 rounded-3xl w-full max-w-md shadow-2xl p-6 text-center space-y-6 animate-modal-pop relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 animate-pulse" />
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 text-3xl">
              🎉
            </div>
            <div>
              <h2 className="text-2xl font-black text-green-400">Congratulations!</h2>
              <p className="text-gray-400 text-xs mt-1">Your trade has completed successfully!</p>
            </div>
            <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Asset Traded</span>
                <span className="font-bold text-white uppercase">{showCongratulations.coin}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Investment Amount</span>
                <span className="font-bold text-white">₹{showCongratulations.amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="border-t border-white/5 my-2 pt-2 flex justify-between items-center">
                <span className="text-sm text-gray-400 font-semibold">Profit Earned</span>
                <span className="text-xl font-black text-green-400">+₹{showCongratulations.profitAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Your trade principal of ₹{showCongratulations.amount.toLocaleString("en-IN")} plus your profit has been credited back to your account balance.
            </p>
            <button
              onClick={() => handleAcknowledgeTrade(showCongratulations._id)}
              className="w-full bg-green-500 hover:bg-green-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-green-500/10 cursor-pointer"
            >
              Acknowledge & Continue
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
