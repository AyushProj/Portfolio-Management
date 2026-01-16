// src/App.jsx
import { useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";

import StockSelector from "./components/StockSelector";
import StockPage from "./components/StockPage";
import TradesPage from "./components/TradesPage";
import PositionsPage from "./components/PositionsPage";
import PnLPage from "./components/PnLPage";
import RealizedPnLPage from "./components/RealizedPnLPage";

import { loadDataset, startSimulation } from "./services/simulator";

const navButtonStyle = {
  marginRight: "12px",
  padding: "8px 16px",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#000000",
  border: "1px solid #ccc",
  cursor: "pointer",
};

const SYMBOLS = ["AAPL", "AMZN", "MSFT", "NFLX", "TSLA"]; // your dataset tickers

function Dashboard() {
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
      <h1>Portfolio Management Dashboard</h1>

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

        <Link to="/realized-pnl">
          <button style={navButtonStyle}>Realized P&amp;L</button>
        </Link>
      </div>

      <StockSelector />
    </div>
  );
}

function App() {
  // ✅ Start frontend simulator once when app loads
  useEffect(() => {
    Promise.all(
      SYMBOLS.map((sym) =>
        fetch(`http://127.0.0.1:5000/prices/${sym}`)
          .then((r) => {
            if (!r.ok) throw new Error(`Failed prices for ${sym}`);
            return r.json();
          })
          .then((data) => loadDataset(sym, data))
      )
    )
      .then(() => {
        // every 2 seconds
        startSimulation({ intervalMs: 2000 });
      })
      .catch((e) => {
        console.error("Simulator preload failed:", e);
      });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/stock/:symbol" element={<StockPage />} />
      <Route path="/trades" element={<TradesPage />} />
      <Route path="/positions" element={<PositionsPage />} />
      <Route path="/pnl" element={<PnLPage />} />
      <Route path="/realized-pnl" element={<RealizedPnLPage />} />
    </Routes>
  );
}

export default App;
