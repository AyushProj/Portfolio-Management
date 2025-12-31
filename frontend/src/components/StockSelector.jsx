import { Link } from "react-router-dom";

const symbols = ["AAPL", "MSFT", "TSLA", "AMZN", "NFLX"];

function StockSelector() {
  return (
    <div style={{ marginBottom: "20px" }}>
      {symbols.map((symbol) => (
        <Link key={symbol} to={`/stock/${symbol}`} style={{ marginRight: "10px" }}>
          <button>{symbol}</button>
        </Link>
      ))}
    </div>
  );
}

export default StockSelector; 
