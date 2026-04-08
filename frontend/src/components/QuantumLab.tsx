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
} from "@/lib/types";

const NUM_QUBITS = 3;
const NUM_STEPS = 8;

export function QuantumLab() {
  const [gates, setGates] = useState<PlacedGate[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeGate, setActiveGate] = useState<GateType | null>(null);

  /* ── Drag handlers ── */
  const handleDragStart = (event: DragStartEvent) => {
    const gateType = event.active.data.current?.gateType as
      | GateType
      | undefined;
    if (gateType) setActiveGate(gateType);
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveGate(null);
      const { active, over } = event;
      if (!over) return;

      // Parse the drop zone id: "cell-{qubit}-{step}"
      const match = over.id.toString().match(/^cell-(\d+)-(\d+)$/);
      if (!match) return;

      const target = parseInt(match[1], 10);
      const step = parseInt(match[2], 10);
      const gateType = active.data.current?.gateType as GateType;
      if (!gateType) return;

      // For CX: if dropped on qubit 0, control=0 target=1; else control=target-1, target=target
      const isExistingGate = active.data.current?.isPlaced === true;

      if (isExistingGate) {
        // Move an existing gate
        const gateId = active.id.toString();
        setGates((prev) =>
          prev.map((g) => {
            if (g.id !== gateId) return g;
            if (gateType === "CX") {
              const control = target === 0 ? 0 : target - 1;
              const cxTarget = target === 0 ? 1 : target;
              return { ...g, target: cxTarget, control, step };
            }
            return { ...g, target, step };
          })
        );
      } else {
        // Place a new gate
        const id = `gate-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newGate: PlacedGate = { id, gate: gateType, target, step };

        if (gateType === "CX") {
          newGate.control = target === 0 ? 0 : target - 1;
          newGate.target = target === 0 ? 1 : target;
        }

        setGates((prev) => [...prev, newGate]);
      }

      // Clear previous result when circuit changes
      setResult(null);
      setError(null);
    },
    []
  );

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
          />

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSimulate}
              disabled={loading || gates.length === 0}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Simulating…" : "▶ Simulate"}
            </button>
            <button
              onClick={handleClear}
              disabled={gates.length === 0}
              className="rounded-lg border border-slate-600 px-6 py-2.5 font-semibold text-slate-300 transition hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear Circuit
            </button>
          </div>

          {/* Error state */}
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-300">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Results chart */}
          {result && <ProbabilityChart probabilities={result.probabilities} />}
        </div>
      </div>

      {/* Drag overlay — ghost that follows cursor */}
      <DragOverlay>
        {activeGateInfo ? (
          <GateToken gate={activeGateInfo} className="opacity-80 scale-110" />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
