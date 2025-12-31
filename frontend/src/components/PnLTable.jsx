import { useEffect, useState } from "react";
import { fetchPnL } from "../services/api";

function PnLTable() {
  const [pnlData, setPnlData] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPnL()
      .then(setPnlData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h2>Unrealized PnL</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Quantity</th>
            <th>Avg Cost</th>
            <th>Current Price</th>
            <th>Market Value</th>
            <th>Cost Basis</th>
            <th>Unrealized PnL</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(pnlData).map(([symbol, data]) => (
            <tr key={symbol}>
              <td>{symbol}</td>
              <td>{data.quantity}</td>
              <td>{data.avg_cost}</td>
              <td>{data.current_price}</td>
              <td>{data.market_value}</td>
              <td>{data.cost_basis}</td>
              <td>{data.unrealized_pnl}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PnLTable;
