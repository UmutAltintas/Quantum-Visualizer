"use client";

import { useState, useCallback, useEffect } from "react";
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
import { ChallengePanel, Challenge } from "./ChallengePanel";
import { simulateCircuit, getIntermediateState, getChallenges } from "@/lib/api";
import {
  PlacedGate,
  GateType,
  SimulationResult,
  GATE_CATALOG,
  PARAMETERIZED_GATES,
  TWO_QUBIT_GATES,
  THREE_QUBIT_GATES,
  IntermediateStateResult,
} from "@/lib/types";
import { Play, Loader2, RotateCcw, AlertCircle, Plus, Minus } from "lucide-react";
import dynamic from "next/dynamic";

const BlochSpherePanel = dynamic(
  () => import("./BlochSphere").then((m) => m.BlochSpherePanel),
  { ssr: false }
);

const MIN_QUBITS = 1;
const MAX_QUBITS = 8;
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
  const [numQubits, setNumQubits] = useState(3);
  const [gates, setGates] = useState<PlacedGate[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeGate, setActiveGate] = useState<GateType | null>(null);
  const [blochData, setBlochData] = useState<IntermediateStateResult | null>(null);
  const [selectedQubit, setSelectedQubit] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);

  // Fetch challenges on mount
  useEffect(() => {
    getChallenges()
      .then((data) => setChallenges(data.map((c) => ({ ...c }))))
      .catch(() => {});
  }, []);

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
      const qubits = resolveGateQubits(gateType, dropQubit, numQubits);

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
    [numQubits]
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
      const maxStep = Math.max(...gates.map((g) => g.step), 0);
      const [res, bloch] = await Promise.all([
        simulateCircuit({ numQubits, gates }),
        getIntermediateState({ numQubits, gates, upToStep: maxStep }),
      ]);
      setResult(res);
      setBlochData(bloch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setResult(null);
      setBlochData(null);
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

  /* ── Add / remove qubits ── */
  const handleAddQubit = useCallback(() => {
    setNumQubits((n) => Math.min(n + 1, MAX_QUBITS));
    setResult(null);
  }, []);

  const handleRemoveQubit = useCallback(() => {
    setNumQubits((n) => {
      const next = Math.max(n - 1, MIN_QUBITS);
      // Remove gates that reference the removed qubit
      setGates((prev) =>
        prev.filter(
          (g) =>
            g.target < next &&
            (g.control === undefined || g.control < next) &&
            (g.control2 === undefined || g.control2 < next)
        )
      );
      return next;
    });
    setResult(null);
  }, []);

  /* ── Update a placed gate (for CX/SWAP/CCX connection editing) ── */
  const handleUpdateGate = useCallback((id: string, updates: Partial<PlacedGate>) => {
    setGates((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
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
        {/* Left panel: gate palette + challenges */}
        <aside className="space-y-6">
          <GatePalette />
          <ChallengePanel
            challenges={challenges}
            gates={gates}
            numQubits={numQubits}
            onSelectChallenge={setActiveChallenge}
            activeChallenge={activeChallenge}
          />
        </aside>

        {/* Main area */}
        <div className="space-y-6">
          {/* Qubit controls */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Qubits: {numQubits}
            </span>
            <button
              onClick={handleRemoveQubit}
              disabled={numQubits <= MIN_QUBITS}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-600 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              title="Remove qubit"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleAddQubit}
              disabled={numQubits >= MAX_QUBITS}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-600 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              title="Add qubit"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <CircuitBoard
            numQubits={numQubits}
            numSteps={NUM_STEPS}
            gates={gates}
            onRemoveGate={handleRemoveGate}
            onUpdateAngle={handleUpdateAngle}
            onUpdateGate={handleUpdateGate}
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

          {/* Results chart + Bloch sphere */}
          {result && (
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <ProbabilityChart probabilities={result.probabilities} />
              {blochData && (
                <BlochSpherePanel
                  blochCoords={blochData.bloch_coords}
                  selectedQubit={selectedQubit}
                  onSelectQubit={setSelectedQubit}
                />
              )}
            </div>
          )}
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
