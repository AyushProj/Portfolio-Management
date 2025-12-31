import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StockChart from "./StockChart";
import { buyStock } from "../services/api";

const WINDOW_SIZE = 50;

function StockPage() {
  const { symbol } = useParams();

  const [allPrices, setAllPrices] = useState([]);
  const [windowStart, setWindowStart] = useState(0);
  const [error, setError] = useState(null);

  const [trendColor, setTrendColor] = useState("#ffffff");
  const [quantity, setQuantity] = useState(1);
  const [buyStatus, setBuyStatus] = useState("");

  /* ---------------- Fetch price data ---------------- */
  useEffect(() => {
    fetch(`http://127.0.0.1:5000/prices/${symbol}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load price data");
        return res.json();
      })
      .then((data) => {
        setAllPrices(data);
        setWindowStart(0);
      })
      .catch((err) => setError(err.message));
  }, [symbol]);

  /* ---------------- Playback logic ---------------- */
  useEffect(() => {
    if (allPrices.length <= WINDOW_SIZE) return;

    const interval = setInterval(() => {
      setWindowStart((prev) => {
        if (prev + WINDOW_SIZE >= allPrices.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [allPrices]);

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  const visibleData = allPrices.slice(
    windowStart,
    windowStart + WINDOW_SIZE
  );

  const currentPoint =
    visibleData.length > 0
      ? visibleData[visibleData.length - 1]
      : null;

  const currentPrice = currentPoint ? currentPoint.open : null;
  const currentDate = currentPoint ? currentPoint.date : null;

  /* ---------------- Trend color logic ---------------- */
  useEffect(() => {
    if (visibleData.length < 2) return;

    const prev = visibleData[visibleData.length - 2].open;
    const curr = visibleData[visibleData.length - 1].open;

    if (curr > prev) {
      setTrendColor("#2ea043"); // green
    } else if (curr < prev) {
      setTrendColor("#f85149"); // red
    }
  }, [visibleData]);

  /* ---------------- Buy handler ---------------- */
  async function handleBuy() {
    if (!currentDate) {
      setBuyStatus("❌ No date available for trade");
      return;
    }

    try {
      setBuyStatus("Placing order...");

      await buyStock({
        symbol,
        quantity: Number(quantity),
        date: currentDate
      });

      setBuyStatus("✅ Buy order executed");
    } catch (err) {
      setBuyStatus(`❌ ${err.message}`);
    }
  }

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
              ${currentPrice}
            </span>
          </h3>
        )}

        <div style={{ marginTop: "20px" }}>
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
            fullData={allPrices}
            trendColor={trendColor}
          />
        )}
      </div>
    </div>
  );
}

export default StockPage;
