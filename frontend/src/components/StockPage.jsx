// src/components/StockPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StockChart from "./StockChart";
import { buyStock } from "../services/api";
import { subscribe } from "../services/simulator";

const WINDOW_SIZE = 50;

function StockPage() {
  const { symbol } = useParams();

  const [allPrices, setAllPrices] = useState([]);
  const [error, setError] = useState(null);

  const [simIndex, setSimIndex] = useState(0);
  const [simPrice, setSimPrice] = useState(null);
  const [simDate, setSimDate] = useState(null);

  const [trendColor, setTrendColor] = useState("#ffffff");
  const [quantity, setQuantity] = useState(1);
  const [buyStatus, setBuyStatus] = useState("");

  // subscribe to global simulator state
  useEffect(() => {
    const unsub = subscribe(({ index, prices, currentDate }) => {
      setSimIndex(index);
      setSimPrice(prices?.[symbol] ?? null);
      setSimDate(currentDate ?? null);
    });
    return unsub;
  }, [symbol]);

  // fetch full dataset for this symbol (for chart window)
  useEffect(() => {
    fetch(`http://127.0.0.1:5000/prices/${symbol}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load price data");
        return res.json();
      })
      .then((data) => setAllPrices(data))
      .catch((err) => setError(err.message));
  }, [symbol]);

  const windowStart = Math.max(0, simIndex - WINDOW_SIZE + 1);

  const visibleData = useMemo(() => {
    return allPrices.slice(windowStart, windowStart + WINDOW_SIZE);
  }, [allPrices, windowStart]);

  // trend color based on last 2 visible points
  useEffect(() => {
    if (visibleData.length < 2) return;
    const prev = visibleData[visibleData.length - 2].open;
    const curr = visibleData[visibleData.length - 1].open;
    setTrendColor(curr >= prev ? "#2ea043" : "#f85149");
  }, [visibleData]);

  async function handleBuy() {
    try {
      setBuyStatus("Placing order...");
      // use simulator date so trade timestamp aligns with dataset
      const dateToUse = simDate ?? (visibleData.at(-1)?.date ?? null);

      if (!dateToUse) throw new Error("No simulated date available");

      await buyStock({
        symbol,
        quantity: Number(quantity),
        date: dateToUse,
      });

      setBuyStatus("✅ Buy order executed");
    } catch (err) {
      setBuyStatus(`❌ ${err.message}`);
    }
  }

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d1117",
        color: "#c9d1d9",
        padding: "24px",
      }}
    >
      <Link to="/" style={{ color: "#58a6ff" }}>
        ← Back to Dashboard
      </Link>

      <h2 style={{ marginTop: "16px" }}>{symbol} — Open Price</h2>

      {typeof simPrice === "number" && (
        <h3>
          Current Price:{" "}
          <span style={{ color: trendColor }}>${simPrice.toFixed(2)}</span>
        </h3>
      )}

      <div style={{ marginTop: "16px" }}>
        <label style={{ marginRight: "10px" }}>
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
            background: "#238636",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Buy
        </button>

        {buyStatus && (
          <div style={{ marginTop: "10px", color: "#aaa" }}>{buyStatus}</div>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        <StockChart data={visibleData} trendColor={trendColor} />
      </div>
    </div>
  );
}

export default StockPage;
