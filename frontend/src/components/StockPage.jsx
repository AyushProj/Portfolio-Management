import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StockChart from "./StockChart";
import { buyStock, sellStock } from "../services/api";

const WINDOW_SIZE = 50;

function StockPage() {
  const { symbol } = useParams();

  const [allPrices, setAllPrices] = useState([]);
  const [simDate, setSimDate] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);

  const [trendColor, setTrendColor] = useState("#ffffff");

  const [quantity, setQuantity] = useState(1);
  const [buyStatus, setBuyStatus] = useState("");

  const [holdingQty, setHoldingQty] = useState(0);
  const [sellQty, setSellQty] = useState(1);
  const [sellStatus, setSellStatus] = useState("");

  const [error, setError] = useState(null);

  /* ---------------- Fetch full historical price data ---------------- */
  useEffect(() => {
    fetch(`http://127.0.0.1:5000/prices/${symbol}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load price data");
        return res.json();
      })
      .then((data) => setAllPrices(data))
      .catch((err) => setError(err.message));
  }, [symbol]);

  /* ---------------- Poll backend simulation state ---------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("http://127.0.0.1:5000/sim/state")
        .then((res) => res.json())
        .then((state) => {
          setSimDate(state.current_date);

          if (state.prices && typeof state.prices[symbol] === "number") {
            setCurrentPrice(state.prices[symbol]);
          }
        })
        .catch(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, [symbol]);

  /* ---------------- Fetch current holdings for this stock ---------------- */
  useEffect(() => {
    fetch("http://127.0.0.1:5000/positions")
      .then((res) => res.json())
      .then((data) => {
        setHoldingQty(data[symbol] || 0);
      })
      .catch(() => {});
  }, [symbol, buyStatus, sellStatus]);

  /* ---------------- Sliding window aligned to simDate ---------------- */
  const visibleData = useMemo(() => {
    if (!simDate || allPrices.length === 0) return [];

    const endIdx = [...allPrices]
      .map((p, idx) => ({ date: p.date, idx }))
      .filter((p) => p.date <= simDate)
      .pop()?.idx;

    if (endIdx === undefined) return [];

    const startIdx = Math.max(0, endIdx - WINDOW_SIZE + 1);
    return allPrices.slice(startIdx, endIdx + 1);
  }, [allPrices, simDate]);

  /* ---------------- Trend color logic ---------------- */
  useEffect(() => {
    if (visibleData.length < 2) return;

    const prev = visibleData[visibleData.length - 2].open;
    const curr = visibleData[visibleData.length - 1].open;

    setTrendColor(curr >= prev ? "#2ea043" : "#f85149");
  }, [visibleData]);

  /* ---------------- Per-stock Unrealized PnL ---------------- */
  const unrealizedPnL =
    holdingQty > 0 && currentPrice !== null
      ? currentPrice * holdingQty -
        holdingQty *
          (allPrices.find((p) => p.date === simDate)?.open || currentPrice)
      : 0;

  const pnlColor = unrealizedPnL >= 0 ? "#2ea043" : "#f85149";

  /* ---------------- Buy handler ---------------- */
  async function handleBuy() {
    if (!simDate) {
      setBuyStatus("❌ Simulation not ready");
      return;
    }

    try {
      setBuyStatus("Placing buy order...");

      await buyStock({
        symbol,
        quantity: Number(quantity),
        date: simDate,
      });

      setBuyStatus("✅ Buy order executed");
    } catch (err) {
      setBuyStatus(`❌ ${err.message}`);
    }
  }

  /* ---------------- Sell handler ---------------- */
  async function handleSell() {
    if (!simDate) {
      setSellStatus("❌ Simulation not ready");
      return;
    }

    if (sellQty > holdingQty) {
      setSellStatus(`❌ You only own ${holdingQty} shares`);
      return;
    }

    try {
      setSellStatus("Placing sell order...");

      await sellStock({
        symbol,
        quantity: Number(sellQty),
        date: simDate,
      });

      setSellStatus("✅ Sell order executed");
    } catch (err) {
      setSellStatus(`❌ ${err.message}`);
    }
  }

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  /* ---------------- UI ---------------- */
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d1117",
        color: "#c9d1d9",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", padding: "0 32px" }}>
        <Link to="/" style={{ color: "#58a6ff" }}>
          ← Back to Dashboard
        </Link>

        <h2 style={{ marginTop: "16px" }}>{symbol} — Open Price</h2>

        {currentPrice !== null && (
          <h3>
            Current Price:{" "}
            <span style={{ color: trendColor }}>
              ${currentPrice.toFixed(2)}
            </span>
          </h3>
        )}

        <h4>
          You own: <strong>{holdingQty}</strong> shares
        </h4>

        {/* BUY */}
        <div style={{ marginTop: "16px" }}>
          <label>
            Buy Quantity:
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={{
                marginLeft: "8px",
                width: "80px",
                background: "#111",
                color: "#fff",
                border: "1px solid #333",
                padding: "4px",
              }}
            />
          </label>

          <button
            onClick={handleBuy}
            style={{
              marginLeft: "12px",
              padding: "6px 14px",
              background: "#238636",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Buy
          </button>

          {buyStatus && (
            <div style={{ marginTop: "8px", color: "#aaa" }}>
              {buyStatus}
            </div>
          )}
        </div>

        {/* SELL */}
        {holdingQty > 0 && (
          <div style={{ marginTop: "16px" }}>
            <label>
              Sell Quantity:
              <input
                type="number"
                min="1"
                max={holdingQty}
                value={sellQty}
                onChange={(e) => setSellQty(e.target.value)}
                style={{
                  marginLeft: "8px",
                  width: "80px",
                  background: "#111",
                  color: "#fff",
                  border: "1px solid #333",
                  padding: "4px",
                }}
              />
            </label>

            <button
              onClick={handleSell}
              style={{
                marginLeft: "12px",
                padding: "6px 14px",
                background: "#da3633",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Sell
            </button>

            {sellStatus && (
              <div style={{ marginTop: "8px", color: "#aaa" }}>
                {sellStatus}
              </div>
            )}
          </div>
        )}

        {/* Chart */}
        {visibleData.length > 0 && (
          <div style={{ marginTop: "32px" }}>
            <StockChart data={visibleData} trendColor={trendColor} />
          </div>
        )}
      </div>
    </div>
  );
}

export default StockPage;
