import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StockChart from "./StockChart";

const WINDOW_SIZE = 50;

function StockPage() {
  const { symbol } = useParams();

  const [allPrices, setAllPrices] = useState([]);
  const [windowStart, setWindowStart] = useState(0);
  const [error, setError] = useState(null);
  const [trendColor, setTrendColor] = useState("#ffffff");

  // Fetch data once
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

  // Sliding window playback
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

  const currentPrice =
    visibleData.length > 0
      ? visibleData[visibleData.length - 1].open
      : null;

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
