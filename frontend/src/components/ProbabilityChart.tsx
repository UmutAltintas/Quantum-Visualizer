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
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

interface ProbabilityChartProps {
  probabilities: Record<string, number>;
}

const COLORS = [
  "#a5b4fc",
  "#c4b5fd",
  "#d8b4fe",
  "#e9d5ff",
  "#93c5fd",
  "#a5b4fc",
  "#818cf8",
  "#7c83db",
];

export function ProbabilityChart({ probabilities }: ProbabilityChartProps) {
  const data = Object.entries(probabilities)
    .map(([state, probability]) => ({
      state: `|${state}⟩`,
      probability: parseFloat((probability * 100).toFixed(2)),
    }))
    .sort((a, b) => a.state.localeCompare(b.state));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6"
    >
      <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <BarChart3 className="h-3.5 w-3.5" />
        Measurement Probabilities
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="state"
            tick={{ fill: "#94a3b8", fontSize: 14, fontFamily: "monospace" }}
            axisLine={{ stroke: "#334155" }}
            tickLine={{ stroke: "#334155" }}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            axisLine={{ stroke: "#334155" }}
            tickLine={{ stroke: "#334155" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#f1f5f9",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
            formatter={(value: number) => [`${value}%`, "Probability"]}
            cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
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
    </motion.div>
  );
}
