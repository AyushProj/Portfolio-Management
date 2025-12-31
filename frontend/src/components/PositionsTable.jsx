import { useEffect, useState } from "react";
import { fetchPositions } from "../services/api";

function PositionsTable() {
  const [positions, setPositions] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPositions()
      .then(setPositions)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h2>Positions</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Net Quantity</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(positions).map(([symbol, quantity]) => (
            <tr key={symbol}>
              <td>{symbol}</td>
              <td>{quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PositionsTable;
