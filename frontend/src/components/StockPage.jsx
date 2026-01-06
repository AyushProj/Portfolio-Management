import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StockChart from "./StockChart";
import { buyStock } from "../services/api";

const WINDOW_SIZE = 50;

function StockPage() {
  const { symbol } = useParams();

  const [allPrices, setAllPrices] = useState([]);
  const [simDate, setSimDate] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);

  const [trendColor, setTrendColor] = useState("#ffffff");
  const [quantity, setQuantity] = useState(1);
  const [buyStatus, setBuyStatus] = useState("");
  const [error, setError] = useState(null);

  /* ---------------- Fetch full historical data ---------------- */
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

          if (
            state.prices &&
            typeof state.prices[symbol] === "number"
          ) {
            setCurrentPrice(state.prices[symbol]);
          }
        })
        .catch(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, [symbol]);

  /* ---------------- Sliding window (FIXED) ---------------- */
  const visibleData = useMemo(() => {
    if (!simDate || allPrices.length === 0) return [];

    // find last index where price.date <= simDate
    const endIdx = [...allPrices]
      .map((p, idx) => ({ date: p.date, idx }))
      .filter((p) => p.date <= simDate)
      .pop()?.idx;

    if (endIdx === undefined) return [];

    const startIdx = Math.max(0, endIdx - WINDOW_SIZE + 1);
    return allPrices.slice(startIdx, endIdx + 1);
  }, [allPrices, simDate]);

  /* ---------------- Trend color ---------------- */
  useEffect(() => {
    if (visibleData.length < 2) return;

    const prev = visibleData[visibleData.length - 2].open;
    const curr = visibleData[visibleData.length - 1].open;

    setTrendColor(curr >= prev ? "#2ea043" : "#f85149");
  }, [visibleData]);

  /* ---------------- Buy handler ---------------- */
  async function handleBuy() {
    if (!simDate) {
      setBuyStatus("❌ Simulation not ready");
      return;
    }

    try {
      setBuyStatus("Placing order...");

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

        <h2 style={{ marginTop: "16px" }}>
          {symbol} — Open Price
        </h2>

        {currentPrice !== null && (
          <h3>
            Current Price:{" "}
            <span style={{ color: trendColor }}>
              ${currentPrice.toFixed(2)}
            </span>
          </h3>
        )}

        <div style={{ marginTop: "20px" }}>
          <label>
            Quantity:
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
              background: "#1f8f3a",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Buy
          </button>

          {buyStatus && (
            <div style={{ marginTop: "10px", color: "#aaa" }}>
              {buyStatus}
            </div>
          )}
        </div>

        {visibleData.length > 0 && (
          <StockChart
            data={visibleData}
            trendColor={trendColor}
          />
        )}
      </div>
    </div>
  );
}

export default StockPage;
