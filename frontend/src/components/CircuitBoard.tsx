"use client";

import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { PlacedGate, GATE_CATALOG, PARAMETERIZED_GATES, TWO_QUBIT_GATES, THREE_QUBIT_GATES } from "@/lib/types";
import { CircuitBoard as CircuitBoardIcon, Trash2 } from "lucide-react";
import { useState } from "react";

interface CircuitBoardProps {
  numQubits: number;
  numSteps: number;
  gates: PlacedGate[];
  onRemoveGate: (id: string) => void;
  onUpdateAngle: (id: string, angle: number) => void;
}

/** A single droppable cell on the circuit grid */
function CircuitCell({
  qubit,
  step,
  gate,
  onRemoveGate,
  onUpdateAngle,
  spanIndicator,
}: {
  qubit: number;
  step: number;
  gate?: PlacedGate;
  onRemoveGate: (id: string) => void;
  onUpdateAngle: (id: string, angle: number) => void;
  spanIndicator?: { color: string; role: "control" | "control2" | "target" };
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

      {/* Wire node dot (only visible when no gate and no span indicator) */}
      {!gate && !spanIndicator && (
        <div className="absolute h-1.5 w-1.5 rounded-full bg-slate-600" />
      )}

      {/* Span indicator (control dot for multi-qubit gates) */}
      {spanIndicator && !gate && (
        <div
          className="absolute z-10 h-3 w-3 rounded-full"
          style={{ backgroundColor: spanIndicator.color }}
          title={spanIndicator.role === "control" || spanIndicator.role === "control2" ? "Control qubit" : "Target qubit"}
        />
      )}

      {/* Placed gate */}
      {gate && (
        <PlacedGateChip
          gate={gate}
          onRemove={onRemoveGate}
          onUpdateAngle={onUpdateAngle}
        />
      )}
    </div>
  );
}

/** Inline angle input for parameterized gates */
function AngleInput({
  value,
  onChange,
  color,
}: {
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");

  const display = `${(value / Math.PI).toFixed(2)}π`;

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const parsed = parseFloat(text);
          if (!isNaN(parsed)) onChange(parsed);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const parsed = parseFloat(text);
            if (!isNaN(parsed)) onChange(parsed);
            setEditing(false);
          }
          if (e.key === "Escape") setEditing(false);
        }}
        className="absolute -bottom-5 left-1/2 z-20 w-14 -translate-x-1/2 rounded border border-slate-600 bg-slate-900 px-1 py-0.5 text-center font-mono text-[9px] text-slate-300 outline-none focus:border-indigo-400"
        placeholder="radians"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      className="absolute -bottom-5 left-1/2 z-20 -translate-x-1/2 rounded px-1 py-0.5 font-mono text-[9px] transition-colors hover:bg-slate-700"
      style={{ color }}
      onClick={(e) => {
        e.stopPropagation();
        setText(value.toFixed(4));
        setEditing(true);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      title="Click to edit angle (in radians)"
    >
      {display}
    </button>
  );
}

/** A draggable + removable gate that's already on the circuit */
function PlacedGateChip({
  gate,
  onRemove,
  onUpdateAngle,
}: {
  gate: PlacedGate;
  onRemove: (id: string) => void;
  onUpdateAngle: (id: string, angle: number) => void;
}) {
  const info = GATE_CATALOG.find((g) => g.type === gate.gate);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: gate.id,
    data: { gateType: gate.gate, isPlaced: true },
  });

  if (!info) return null;

  const isParameterized = PARAMETERIZED_GATES.includes(gate.gate);

  return (
    <div className="relative">
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

      {/* Angle input for parameterized gates */}
      {isParameterized && gate.angle !== undefined && (
        <AngleInput
          value={gate.angle}
          onChange={(v) => onUpdateAngle(gate.id, v)}
          color={info.color}
        />
      )}
    </div>
  );
}

export function CircuitBoard({
  numQubits,
  numSteps,
  gates,
  onRemoveGate,
  onUpdateAngle,
}: CircuitBoardProps) {
  const qubits = Array.from({ length: numQubits }, (_, i) => i);
  const steps = Array.from({ length: numSteps }, (_, i) => i);

  /** Find the gate placed at a specific qubit + step (target qubit) */
  const gateAt = (qubit: number, step: number) =>
    gates.find((g) => g.target === qubit && g.step === step);

  /** Check if a cell should show a span indicator (control dot) */
  const spanIndicatorAt = (qubit: number, step: number) => {
    for (const g of gates) {
      if (g.step !== step) continue;
      const info = GATE_CATALOG.find((c) => c.type === g.gate);
      if (!info) continue;

      if (g.control === qubit) {
        return { color: info.color, role: "control" as const };
      }
      if (g.control2 === qubit) {
        return { color: info.color, role: "control2" as const };
      }
    }
    return undefined;
  };

  /** Get vertical connector lines for multi-qubit gates */
  const multiQubitConnectors = gates.filter((g) => {
    return TWO_QUBIT_GATES.includes(g.gate) || THREE_QUBIT_GATES.includes(g.gate);
  });

  return (
    <div className="overflow-x-auto rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <CircuitBoardIcon className="h-3.5 w-3.5" />
        Quantum Circuit
      </h2>

      <div className="relative inline-flex flex-col gap-1">
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
                onUpdateAngle={onUpdateAngle}
                spanIndicator={!gateAt(q, s) ? spanIndicatorAt(q, s) : undefined}
              />
            ))}

            {/* Output wire + measurement node */}
            <div className="flex items-center gap-1">
              <div className="h-px w-4 bg-slate-600" />
              <div className="h-2 w-2 rounded-full border border-slate-500 bg-slate-700" />
            </div>
          </div>
        ))}

        {/* Vertical connector lines for multi-qubit gates */}
        {multiQubitConnectors.map((g) => {
          const info = GATE_CATALOG.find((c) => c.type === g.gate);
          if (!info) return null;

          const involvedQubits = [g.target];
          if (g.control !== undefined) involvedQubits.push(g.control);
          if (g.control2 !== undefined) involvedQubits.push(g.control2);

          const minQ = Math.min(...involvedQubits);
          const maxQ = Math.max(...involvedQubits);

          // Position calculation: label(56px) + gap(4px) + inputNode(16px) + gap(4px) + step*(56px+4px) + center(28px)
          const left = 56 + 4 + 8 + 4 + g.step * 60 + 28;
          const rowHeight = 60; // h-14(56px) + gap-1(4px)
          const top = minQ * rowHeight + 28;
          const height = (maxQ - minQ) * rowHeight;

          return (
            <div
              key={`connector-${g.id}`}
              className="pointer-events-none absolute z-[5]"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: "2px",
                height: `${height}px`,
                backgroundColor: info.color,
                opacity: 0.6,
              }}
            />
          );
        })}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Right-click a gate to remove it. Drag placed gates to reposition. Click angle labels to edit.
      </p>
    </div>
  );
}
