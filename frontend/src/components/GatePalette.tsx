"use client";

import { useDraggable } from "@dnd-kit/core";
import { GATE_CATALOG, GateInfo } from "@/lib/types";
import { GateToken } from "./GateToken";
import { useState } from "react";

function DraggablePaletteGate({ gate }: { gate: GateInfo }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${gate.type}`,
    data: { gateType: gate.type, isPlaced: false },
  });

  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={isDragging ? "opacity-30" : ""}
      >
        <GateToken gate={gate} className="cursor-grab active:cursor-grabbing" />
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute left-full top-1/2 z-50 ml-3 w-64 -translate-y-1/2 rounded-lg bg-slate-800 p-3 text-sm text-slate-200 shadow-xl border border-slate-600">
          <div className="font-bold mb-1" style={{ color: gate.color }}>
            {gate.label} Gate
          </div>
          <p className="leading-relaxed">{gate.description}</p>
          {/* Arrow */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800" />
        </div>
      )}
    </div>
  );
}

export function GatePalette() {
  return (
    <div className="rounded-xl bg-[var(--bg-secondary)] p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Gate Library
      </h2>
      <div className="flex flex-col gap-3">
        {GATE_CATALOG.map((gate) => (
          <DraggablePaletteGate key={gate.type} gate={gate} />
        ))}
      </div>
      <p className="mt-4 text-xs text-[var(--text-secondary)]">
        Drag a gate onto the circuit. Hover for details.
      </p>
    </div>
  );
}
