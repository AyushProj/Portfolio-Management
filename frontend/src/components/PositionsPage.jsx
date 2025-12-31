import { Link } from "react-router-dom";
import PositionsTable from "./PositionsTable";

function PositionsPage() {
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
      <Link to="/" style={{ color: "#58a6ff" }}>
        ← Back to Dashboard
      </Link>

      <h2 style={{ marginTop: "16px" }}>Positions</h2>
      <PositionsTable />
    </div>
  );
}

export default PositionsPage;
