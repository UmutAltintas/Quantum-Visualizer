"use client";

import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { PlacedGate, GATE_CATALOG } from "@/lib/types";
import { CircuitBoard as CircuitBoardIcon, Trash2 } from "lucide-react";

interface CircuitBoardProps {
  numQubits: number;
  numSteps: number;
  gates: PlacedGate[];
  onRemoveGate: (id: string) => void;
}

/** A single droppable cell on the circuit grid */
function CircuitCell({
  qubit,
  step,
  gate,
  onRemoveGate,
}: {
  qubit: number;
  step: number;
  gate?: PlacedGate;
  onRemoveGate: (id: string) => void;
}) {
  const cellId = `cell-${qubit}-${step}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: cellId });

  return (
    <div
      ref={setDropRef}
      className={`
        relative flex h-14 w-14 items-center justify-center rounded-md border
        transition-all duration-200
        ${
          isOver
            ? "border-indigo-400 bg-indigo-400/15 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
            : gate
              ? "border-transparent"
              : "border-transparent hover:border-slate-600/50 hover:bg-slate-700/20"
        }
      `}
    >
      {/* Wire line through cell */}
      <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-slate-600" />

      {/* Wire node dot (only visible when no gate is placed) */}
      {!gate && (
        <div className="absolute h-1.5 w-1.5 rounded-full bg-slate-600" />
      )}

      {/* Placed gate */}
      {gate && <PlacedGateChip gate={gate} onRemove={onRemoveGate} />}
    </div>
  );
}

/** A draggable + removable gate that's already on the circuit */
function PlacedGateChip({
  gate,
  onRemove,
}: {
  gate: PlacedGate;
  onRemove: (id: string) => void;
}) {
  const info = GATE_CATALOG.find((g) => g.type === gate.gate);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: gate.id,
    data: { gateType: gate.gate, isPlaced: true },
  });

  if (!info) return null;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onContextMenu={(e) => {
        e.preventDefault();
        onRemove(gate.id);
      }}
      className={`
        group relative z-10 flex h-11 w-11 cursor-grab items-center justify-center
        rounded-md border-2 text-xs font-bold select-none
        shadow-md transition-all duration-200
        active:cursor-grabbing
        ${isDragging ? "opacity-30 scale-110" : "hover:scale-105"}
      `}
      style={{
        borderColor: info.color,
        backgroundColor: `${info.color}18`,
        color: info.color,
        boxShadow: isDragging
          ? `0 0 16px ${info.color}55, 0 4px 12px rgba(0,0,0,0.3)`
          : `0 2px 8px rgba(0,0,0,0.25)`,
      }}
      title="Right-click to remove"
    >
      {info.label}
      {/* Remove indicator on hover */}
      <div className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex">
        <Trash2 className="h-2.5 w-2.5" />
      </div>
    </div>
  );
}

export function CircuitBoard({
  numQubits,
  numSteps,
  gates,
  onRemoveGate,
}: CircuitBoardProps) {
  const qubits = Array.from({ length: numQubits }, (_, i) => i);
  const steps = Array.from({ length: numSteps }, (_, i) => i);

  /** Find the gate placed at a specific qubit + step */
  const gateAt = (qubit: number, step: number) =>
    gates.find((g) => g.target === qubit && g.step === step);

  return (
    <div className="overflow-x-auto rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <CircuitBoardIcon className="h-3.5 w-3.5" />
        Quantum Circuit
      </h2>

      <div className="inline-flex flex-col gap-1">
        {qubits.map((q) => (
          <div key={q} className="flex items-center gap-1">
            {/* Qubit label */}
            <span className="w-14 text-right text-sm font-mono text-slate-500">
              q[{q}]
            </span>

            {/* Input node */}
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full border border-slate-500 bg-slate-700" />
            </div>

            {/* Cells */}
            {steps.map((s) => (
              <CircuitCell
                key={`${q}-${s}`}
                qubit={q}
                step={s}
                gate={gateAt(q, s)}
                onRemoveGate={onRemoveGate}
              />
            ))}

            {/* Output wire + measurement node */}
            <div className="flex items-center gap-1">
              <div className="h-px w-4 bg-slate-600" />
              <div className="h-2 w-2 rounded-full border border-slate-500 bg-slate-700" />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Right-click a gate to remove it. Drag placed gates to reposition.
      </p>
    </div>
  );
}
