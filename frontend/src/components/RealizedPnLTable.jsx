import { useEffect, useState } from "react";
import { fetchRealizedTrades } from "../services/api";

function RealizedPnLTable() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRealizedTrades()
      .then(setRows)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p style={{ color: "#f85149" }}>{error}</p>;
  }

  if (rows.length === 0) {
    return <p style={{ color: "#8b949e" }}>No realized trades yet.</p>;
  }

  return (
    <div style={{ overflowX: "auto", marginTop: "16px" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "#0d1117",
          color: "#c9d1d9",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid #30363d" }}>
            <th style={thStyle}>Symbol</th>
            <th style={thStyle}>Quantity Sold</th>
            <th style={thStyle}>Avg Buy Price</th>
            <th style={thStyle}>Sell Price</th>
            <th style={thStyle}>Realized P&amp;L</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => {
            const pnlColor = r.realized_pnl >= 0 ? "#2ea043" : "#f85149";
            return (
              <tr
                key={r.id}
                style={{
                  borderBottom: "1px solid #21262d",
                }}
              >
                <td style={tdStyle}>{r.symbol}</td>
                <td style={tdStyle}>{r.quantity_sold}</td>
                <td style={tdStyle}>${r.avg_buy_price.toFixed(2)}</td>
                <td style={tdStyle}>${r.sell_price.toFixed(2)}</td>
                <td style={{ ...tdStyle, color: pnlColor }}>
                  ${r.realized_pnl.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "12px",
  fontWeight: "600",
  fontSize: "14px",
  color: "#8b949e",
};

const tdStyle = {
  padding: "12px",
  fontSize: "14px",
};

export default RealizedPnLTable;
