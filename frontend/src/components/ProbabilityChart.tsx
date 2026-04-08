"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ProbabilityChartProps {
  probabilities: Record<string, number>;
}

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
  "#818cf8",
  "#6366f1",
  "#4f46e5",
  "#4338ca",
];

export function ProbabilityChart({ probabilities }: ProbabilityChartProps) {
  const data = Object.entries(probabilities)
    .map(([state, probability]) => ({
      state: `|${state}⟩`,
      probability: parseFloat((probability * 100).toFixed(2)),
    }))
    .sort((a, b) => a.state.localeCompare(b.state));

  return (
    <div className="rounded-xl bg-[var(--bg-secondary)] p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Measurement Probabilities
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="state"
            tick={{ fill: "#94a3b8", fontSize: 14, fontFamily: "monospace" }}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              borderRadius: "8px",
              color: "#f1f5f9",
            }}
            formatter={(value: number) => [`${value}%`, "Probability"]}
          />
          <Bar
            dataKey="probability"
            radius={[6, 6, 0, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
