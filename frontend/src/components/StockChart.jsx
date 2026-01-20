import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function StockChart({ data, trendColor }) {
  return (
    <div
      style={{
        width: "100%",           
        maxWidth: "1200px",      
        height: 520,
        backgroundColor: "#0e1117",
        borderRadius: "10px",
        padding: "16px",
        boxSizing: "border-box",
        marginBottom: "48px",    
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid stroke="#2a2e39" strokeDasharray="3 3" />

          <XAxis
            dataKey="date"
            tick={{ fill: "#c9d1d9", fontSize: 12 }}
            tickMargin={10}       
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
