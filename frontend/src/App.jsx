import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";

import TradesTable from "./components/TradesTable";
import PositionsTable from "./components/PositionsTable";
import PnLTable from "./components/PnLTable";
import StockSelector from "./components/StockSelector";
import StockPage from "./components/StockPage";
import TradesPage from "./components/TradesPage";
import PositionsPage from "./components/PositionsPage";
import PnLPage from "./components/PnLPage";

const navButtonStyle = {
  marginRight: "12px",
  padding: "8px 16px",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#000000",
  border: "1px solid #ccc",
  cursor: "pointer",
};

function Dashboard() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/")
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch(() => setStatus("Backend not reachable"));
  }, []);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
      <h1>Portfolio Management Dashboard</h1>

      {/* Navigation buttons */}
      <div style={{ marginBottom: "24px" }}>
        <Link to="/trades">
          <button style={navButtonStyle}>Trades</button>
        </Link>

        <Link to="/positions">
          <button style={navButtonStyle}>Positions</button>
        </Link>

        <Link to="/pnl">
          <button style={navButtonStyle}>P&amp;L</button>
        </Link>
      </div>

      <StockSelector />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/stock/:symbol" element={<StockPage />} />
      <Route path="/trades" element={<TradesPage />} />
      <Route path="/positions" element={<PositionsPage />} />
      <Route path="/pnl" element={<PnLPage />} />
    </Routes>
  );
}

export default App;
