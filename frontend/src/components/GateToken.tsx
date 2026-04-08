"use client";

import { GateInfo } from "@/lib/types";

interface GateTokenProps {
  gate: GateInfo;
  className?: string;
}

export function GateToken({ gate, className = "" }: GateTokenProps) {
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-sm font-bold select-none ${className}`}
      style={{
        borderColor: gate.color,
        backgroundColor: `${gate.color}22`,
        color: gate.color,
      }}
    >
      {gate.label}
    </div>
  );
}
