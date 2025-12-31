import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts";

function StockChart({ data }) {
  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        paddingBottom: "20px",
      }}
    >
      {/* Make chart wider than screen */}
      <div style={{ width: Math.max(900, data.length * 20), height: 600 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              dataKey="open"
              domain={["auto", "auto"]}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip formatter={(v) => `$${v}`} />
            <Line
              type="monotone"
              dataKey="open"
              stroke="#1976d2"
              dot={false}
            />

            {/* Scroll / zoom selector */}
            <Brush
              dataKey="date"
              height={30}
              stroke="#8884d8"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default StockChart;
