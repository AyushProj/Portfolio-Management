import { useEffect, useState } from "react";
import { subscribe } from "../services/simulator";

const thStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #30363d",
  color: "#c9d1d9",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #21262d",
};

function PnLTable() {
  const [positions, setPositions] = useState({});
  const [simPrices, setSimPrices] = useState({});

  // load static position data once
  useEffect(() => {
    fetch("http://127.0.0.1:5000/pnl")
      .then((res) => res.json())
      .then((data) => setPositions(data));
  }, []);

  // 🔥 subscribe to LIVE simulated prices
  useEffect(() => {
    const unsub = subscribe((prices) => {
      setSimPrices(prices);
    });
    return unsub;
  }, []);

  const symbols = Object.keys(positions);
  if (symbols.length === 0) return <p>No open positions</p>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
      <thead>
        <tr>
          <th style={thStyle}>Symbol</th>
          <th style={thStyle}>Quantity</th>
          <th style={thStyle}>Avg Cost</th>
          <th style={thStyle}>Current Price</th>
          <th style={thStyle}>Total Invested</th>
          <th style={thStyle}>Unrealized PnL</th>
        </tr>
      </thead>

      <tbody>
        {symbols.map((symbol) => {
          const row = positions[symbol];

          const qty = row.quantity;
          const avgCost = row.avg_cost;

          // ✅ THIS WILL NOW CHANGE EVERY 2s
          const currentPrice =
            typeof simPrices[symbol] === "number"
              ? simPrices[symbol]
              : row.current_price;

          const totalInvested = qty * avgCost;
          const marketValue = qty * currentPrice;
          const unrealizedPnL = marketValue - totalInvested;

          const pnlColor = unrealizedPnL >= 0 ? "#2ea043" : "#f85149";

          return (
            <tr key={symbol}>
              <td style={tdStyle}>{symbol}</td>
              <td style={tdStyle}>{qty}</td>
              <td style={tdStyle}>${avgCost.toFixed(2)}</td>
              <td style={tdStyle}>${currentPrice.toFixed(2)}</td>
              <td style={tdStyle}>${totalInvested.toFixed(2)}</td>
              <td style={{ ...tdStyle, color: pnlColor }}>
                ${unrealizedPnL.toFixed(2)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default PnLTable;
