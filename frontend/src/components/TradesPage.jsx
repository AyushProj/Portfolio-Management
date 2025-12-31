import { Link } from "react-router-dom";
import TradesTable from "./TradesTable";

function TradesPage() {
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
      <Link to="/" style={{ color: "#58a6ff" }}>
        ← Back to Dashboard
      </Link>

      <h2 style={{ marginTop: "16px" }}>Trades</h2>
      <TradesTable />
    </div>
  );
}

export default TradesPage;
