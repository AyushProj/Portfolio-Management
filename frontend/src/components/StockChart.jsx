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

function StockChart({ data, fullData, trendColor }) {
  return (
    <div
      style={{
        width: "80%",
        height: 520,
        backgroundColor: "#0e1117",
        borderRadius: "10px",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#2a2e39" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#c9d1d9", fontSize: 12 }}
          />
          <YAxis
            dataKey="open"
            domain={["auto", "auto"]}
            tick={{ fill: "#c9d1d9", fontSize: 12 }}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              color: "#c9d1d9",
            }}
            formatter={(v) => `$${v}`}
          />
          <Line
            type="monotone"
            dataKey="open"
            stroke={trendColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default StockChart;
