"use client";

import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { PlacedGate, GATE_CATALOG } from "@/lib/types";

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
      className={`relative flex h-14 w-14 items-center justify-center rounded-md border transition-colors ${
        isOver
          ? "border-indigo-400 bg-indigo-400/20"
          : "border-transparent hover:border-slate-600"
      }`}
    >
      {/* Wire line through cell */}
      <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-[var(--wire-color)]" />

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
      className={`relative z-10 flex h-11 w-11 cursor-grab items-center justify-center rounded-md border-2 text-xs font-bold select-none active:cursor-grabbing ${
        isDragging ? "opacity-30" : ""
      }`}
      style={{
        borderColor: info.color,
        backgroundColor: `${info.color}33`,
        color: info.color,
      }}
      title="Right-click to remove"
    >
      {info.label}
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
    <div className="overflow-x-auto rounded-xl bg-[var(--bg-secondary)] p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Quantum Circuit
      </h2>

      <div className="inline-flex flex-col gap-1">
        {qubits.map((q) => (
          <div key={q} className="flex items-center gap-1">
            {/* Qubit label */}
            <span className="w-12 text-right text-sm font-mono text-[var(--text-secondary)]">
              q[{q}]
            </span>

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

            {/* Output wire */}
            <div className="h-px w-6 bg-[var(--wire-color)]" />
          </div>
        ))}
      </div>

      {/* CX connections drawn as vertical lines between control & target */}
      {gates
        .filter((g) => g.gate === "CX" && g.control !== undefined)
        .map((g) => {
          const minQ = Math.min(g.target, g.control!);
          const maxQ = Math.max(g.target, g.control!);
          // Approximate pixel positioning
          const left = 48 + 12 + g.step * 60 + 28; // label width + gap + step*cellWidth + center
          const top = minQ * 60 + 28;
          const height = (maxQ - minQ) * 60;

          return (
            <div
              key={`cx-line-${g.id}`}
              className="pointer-events-none absolute"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: "2px",
                height: `${height}px`,
                backgroundColor: "#3b82f6",
              }}
            />
          );
        })}

      <p className="mt-3 text-xs text-[var(--text-secondary)]">
        Right-click a gate to remove it. Drag placed gates to reposition.
      </p>
    </div>
  );
}
