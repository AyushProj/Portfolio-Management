import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import TradesTable from "./components/TradesTable";
import PositionsTable from "./components/PositionsTable";
import PnLTable from "./components/PnLTable";
import StockSelector from "./components/StockSelector";
import StockPage from "./components/StockPage";


function Dashboard() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/")
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch(() => setStatus("Backend not reachable"));
  }, []);

  return (
    <div>
      <h1>Portfolio Management Dashboard</h1>
      <p>{status}</p>

      <StockSelector />

      <TradesTable />
      <PositionsTable />
      <PnLTable />
    </div>
  );
}


function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/stock/:symbol" element={<StockPage />} />
    </Routes>
  );
}

export default App;
