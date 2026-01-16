import { Link } from "react-router-dom";
import RealizedPnLTable from "./RealizedPnLTable";

function RealizedPnLPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d1117",
        color: "#c9d1d9",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <Link to="/" style={{ color: "#58a6ff" }}>
          ← Back to Dashboard
        </Link>

        <h1 style={{ marginTop: "16px", marginBottom: "8px" }}>
          Realized P&amp;L
        </h1>

        <p style={{ color: "#8b949e", marginBottom: "16px" }}>
          Closed trades and realized profit/loss
        </p>

        <RealizedPnLTable />
      </div>
    </div>
  );
}

export default RealizedPnLPage;
