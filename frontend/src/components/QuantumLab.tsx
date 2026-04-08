"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  pointerWithin,
} from "@dnd-kit/core";
import { GatePalette } from "./GatePalette";
import { CircuitBoard } from "./CircuitBoard";
import { ProbabilityChart } from "./ProbabilityChart";
import { GateToken } from "./GateToken";
import { simulateCircuit } from "@/lib/api";
import {
  PlacedGate,
  GateType,
  SimulationResult,
  GATE_CATALOG,
  PARAMETERIZED_GATES,
  TWO_QUBIT_GATES,
  THREE_QUBIT_GATES,
} from "@/lib/types";
import { Play, Loader2, RotateCcw, AlertCircle } from "lucide-react";

const NUM_QUBITS = 3;
const NUM_STEPS = 8;

/** Compute qubit assignments when a multi-qubit gate is dropped */
function resolveGateQubits(
  gateType: GateType,
  dropQubit: number,
  numQubits: number
): Partial<PlacedGate> {
  if (THREE_QUBIT_GATES.includes(gateType)) {
    // CCX needs 3 qubits: ensure we fit
    const target = Math.min(dropQubit, numQubits - 1);
    const control = target >= 1 ? target - 1 : 1;
    const control2 = target >= 2 ? target - 2 : 2;
    return { target, control, control2 };
  }
  if (TWO_QUBIT_GATES.includes(gateType)) {
    // CX / SWAP: control + target
    if (dropQubit === 0) return { target: 1, control: 0 };
    return { target: dropQubit, control: dropQubit - 1 };
  }
  return { target: dropQubit };
}

export function QuantumLab() {
  const [gates, setGates] = useState<PlacedGate[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeGate, setActiveGate] = useState<GateType | null>(null);

  /* ── Drag handlers ── */
  const handleDragStart = (event: DragStartEvent) => {
    const gateType = event.active.data.current?.gateType as GateType | undefined;
    if (gateType) setActiveGate(gateType);
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveGate(null);
      const { active, over } = event;
      if (!over) return;

      const match = over.id.toString().match(/^cell-(\d+)-(\d+)$/);
      if (!match) return;

      const dropQubit = parseInt(match[1], 10);
      const step = parseInt(match[2], 10);
      const gateType = active.data.current?.gateType as GateType;
      if (!gateType) return;

      const isExistingGate = active.data.current?.isPlaced === true;
      const qubits = resolveGateQubits(gateType, dropQubit, NUM_QUBITS);

      if (isExistingGate) {
        const gateId = active.id.toString();
        setGates((prev) =>
          prev.map((g) =>
            g.id === gateId ? { ...g, ...qubits, step } : g
          )
        );
      } else {
        const id = `gate-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newGate: PlacedGate = {
          id,
          gate: gateType,
          target: qubits.target ?? dropQubit,
          step,
          ...(qubits.control !== undefined && { control: qubits.control }),
          ...(qubits.control2 !== undefined && { control2: qubits.control2 }),
          ...(PARAMETERIZED_GATES.includes(gateType) && { angle: Math.PI / 2 }),
        };
        setGates((prev) => [...prev, newGate]);
      }

      setResult(null);
      setError(null);
    },
    []
  );

  /* ── Update gate angle (for parameterized gates) ── */
  const handleUpdateAngle = useCallback((id: string, angle: number) => {
    setGates((prev) =>
      prev.map((g) => (g.id === id ? { ...g, angle } : g))
    );
    setResult(null);
    setError(null);
  }, []);

  /* ── Remove gate on right-click ── */
  const handleRemoveGate = useCallback((id: string) => {
    setGates((prev) => prev.filter((g) => g.id !== id));
    setResult(null);
    setError(null);
  }, []);

  /* ── Simulate ── */
  const handleSimulate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await simulateCircuit({ numQubits: NUM_QUBITS, gates });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [gates]);

  /* ── Clear circuit ── */
  const handleClear = useCallback(() => {
    setGates([]);
    setResult(null);
    setError(null);
  }, []);

  const activeGateInfo = activeGate
    ? GATE_CATALOG.find((g) => g.type === activeGate)
    : null;

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Left panel: gate palette */}
        <aside>
          <GatePalette />
        </aside>

        {/* Main area */}
        <div className="space-y-6">
          <CircuitBoard
            numQubits={NUM_QUBITS}
            numSteps={NUM_STEPS}
            gates={gates}
            onRemoveGate={handleRemoveGate}
            onUpdateAngle={handleUpdateAngle}
          />

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSimulate}
              disabled={loading || gates.length === 0}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition-all duration-200 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {loading ? "Simulating…" : "Simulate"}
            </button>
            <button
              onClick={handleClear}
              disabled={gates.length === 0}
              className="flex items-center gap-2 rounded-lg border border-slate-600 px-6 py-2.5 font-semibold text-slate-300 transition-all duration-200 hover:bg-slate-700 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4" />
              Clear Circuit
            </button>
          </div>

          {/* Error state */}
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <strong className="font-semibold">Simulation Error</strong>
                <p className="mt-1 text-sm text-red-300/80">{error}</p>
              </div>
            </div>
          )}

          {/* Results chart */}
          {result && <ProbabilityChart probabilities={result.probabilities} />}
        </div>
      </div>

      {/* Drag overlay — ghost that follows cursor */}
      <DragOverlay dropAnimation={null}>
        {activeGateInfo ? (
          <GateToken gate={activeGateInfo} isDragging className="opacity-90" />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
