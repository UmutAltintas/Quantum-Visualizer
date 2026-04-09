"use client";

import { useDraggable } from "@dnd-kit/core";
import { GATE_CATALOG, GateInfo } from "@/lib/types";
import { GateToken } from "./GateToken";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Sigma } from "lucide-react";

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
        <GateToken
          gate={gate}
          isDragging={isDragging}
          className="cursor-grab active:cursor-grabbing"
        />
      </div>

      {/* Animated Tooltip */}
      <AnimatePresence>
        {showTooltip && !isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-full top-1/2 z-50 ml-3 w-72 -translate-y-1/2 rounded-lg bg-slate-800/90 p-4 text-sm text-slate-300 shadow-xl border border-slate-600/40 backdrop-blur-sm"
          >
            <div
              className="flex items-center gap-2 font-bold mb-2"
              style={{ color: gate.color }}
            >
              {gate.label} Gate
            </div>
            <p className="leading-relaxed text-slate-300 mb-3">
              {gate.description}
            </p>
            {/* Matrix representation */}
            <div className="flex items-center gap-2 rounded-md bg-slate-900/60 px-3 py-2 font-mono text-xs text-slate-400 border border-slate-700/50">
              <Sigma className="h-3.5 w-3.5 shrink-0 text-indigo-300/70" />
              <span>{gate.matrix}</span>
            </div>
            {/* Arrow */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800/95" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const GATE_GROUPS: { label: string; types: string[] }[] = [
  { label: "Single Qubit", types: ["H", "X", "Y", "Z"] },
  { label: "Rotation", types: ["Rx", "Ry", "Rz"] },
  { label: "Multi-Qubit", types: ["CX", "SWAP", "CCX"] },
];

export function GatePalette() {
  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <LayoutGrid className="h-3.5 w-3.5" />
        Gate Library
      </h2>
      <div className="flex flex-col gap-4">
        {GATE_GROUPS.map((group) => {
          const groupGates = GATE_CATALOG.filter((g) =>
            group.types.includes(g.type)
          );
          if (groupGates.length === 0) return null;
          return (
            <div key={group.label}>
              <h3 className="mb-2 text-[10px] font-medium uppercase tracking-widest text-slate-500">
                {group.label}
              </h3>
              <div className="flex flex-col gap-2">
                {groupGates.map((gate) => (
                  <DraggablePaletteGate key={gate.type} gate={gate} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Drag a gate onto the circuit. Hover for details.
      </p>
    </div>
  );
}
