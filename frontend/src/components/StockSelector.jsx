import { Link, useLocation } from "react-router-dom";

const STOCKS = ["AAPL", "MSFT", "TSLA", "AMZN", "NFLX"];

function StockSelector() {
  const location = useLocation();
  const currentSymbol = location.pathname.split("/")[2];

  return (
    <div style={{ marginBottom: "24px" }}>
      {STOCKS.map((symbol) => {
        const isActive = symbol === currentSymbol;

        return (
          <Link
            key={symbol}
            to={`/stock/${symbol}`}
            style={{ textDecoration: "none" }}
          >
            <button
              style={{
                marginRight: "12px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: isActive ? "2px solid #58a6ff" : "1px solid #ccc",
                backgroundColor: "#ffffff",
                color: "#000000",
                fontWeight: isActive ? "600" : "500",
                cursor: "pointer",
                boxShadow: isActive
                  ? "0 0 0 2px rgba(88,166,255,0.4)"
                  : "none",
              }}
            >
              {symbol}
            </button>
          </Link>
        );
      })}
    </div>
  );
}

export default StockSelector;
