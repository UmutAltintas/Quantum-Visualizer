"use client";

import { GateInfo } from "@/lib/types";

interface GateTokenProps {
  gate: GateInfo;
  className?: string;
  /** Whether this gate is actively being dragged */
  isDragging?: boolean;
}

export function GateToken({
  gate,
  className = "",
  isDragging = false,
}: GateTokenProps) {
  return (
    <div
      className={`
        flex h-12 w-12 items-center justify-center rounded-md
        border-2 text-sm font-bold select-none
        shadow-md transition-all duration-200
        ${isDragging ? "scale-110" : ""}
        ${className}
      `}
      style={{
        borderColor: gate.color,
        backgroundColor: `${gate.color}18`,
        color: gate.color,
        boxShadow: isDragging
          ? `0 0 16px ${gate.color}55, 0 4px 12px rgba(0,0,0,0.3)`
          : `0 2px 8px rgba(0,0,0,0.25)`,
      }}
    >
      {gate.label}
    </div>
  );
}
