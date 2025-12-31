import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StockChart from "./StockChart";

function StockPage() {
  const { symbol } = useParams();

  const [allPrices, setAllPrices] = useState([]);
  const [visibleCount, setVisibleCount] = useState(1);
  const [error, setError] = useState(null);

  // Fetch full dataset once
  useEffect(() => {
    fetch(`http://127.0.0.1:5000/prices/${symbol}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load price data");
        return res.json();
      })
      .then((data) => {
        setAllPrices(data);
        setVisibleCount(1); // reset playback
      })
      .catch((err) => setError(err.message));
  }, [symbol]);

  // Playback: add one new day every 2 seconds
  useEffect(() => {
    if (allPrices.length === 0) return;

    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= allPrices.length) {
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

  const visibleData = allPrices.slice(0, visibleCount);
  const currentPrice =
    visibleData.length > 0
      ? visibleData[visibleData.length - 1].open
      : null;

  return (
    <div>
      <Link to="/">← Back to Dashboard</Link>

      <h2>{symbol} — Open Price Playback</h2>

      {currentPrice !== null && (
        <h3 style={{ marginTop: "10px" }}>
          Current Open Price: ${currentPrice}
        </h3>
      )}

      {visibleData.length > 0 && <StockChart data={visibleData} />}

      {visibleCount >= allPrices.length && (
        <p style={{ marginTop: "10px" }}>
          Playback complete
        </p>
      )}
    </div>
  );
}

export default StockPage;
