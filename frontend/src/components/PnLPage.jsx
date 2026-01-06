import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PnLTable from "./PnLTable";

function PnLPage() {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/pnl")
      .then((res) => res.json())
      .then((data) => {
        const rows = Object.entries(data).map(([symbol, d]) => ({
          symbol,
          quantity: d.quantity,
          avgCost: d.avg_cost,
          backendPrice: d.current_price,
          costBasis: d.cost_basis,
        }));
        setPositions(rows);
      });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        color: "#c9d1d9",
        padding: "24px",
      }}
    >
      <Link to="/" style={{ color: "#58a6ff" }}>
        ← Back to Dashboard
      </Link>

      <h2 style={{ marginTop: "16px" }}>Unrealized P&amp;L</h2>

      <PnLTable positions={positions} />
    </div>
  );
}

export default PnLPage;
