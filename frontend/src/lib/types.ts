/* ─── Shared types between frontend and backend ─── */

/** Supported quantum gate identifiers */
export type GateType = "H" | "X" | "Y" | "Z" | "CX";

/** A single gate placed on the circuit */
export interface PlacedGate {
  /** Unique id for React keys / drag tracking */
  id: string;
  /** Which gate */
  gate: GateType;
  /** Target qubit index (0-based) */
  target: number;
  /** Control qubit index – only used for CX */
  control?: number;
  /** Column position on the circuit (time step) */
  step: number;
}

/** Payload sent to the backend /simulate endpoint */
export interface CircuitPayload {
  /** Number of qubits (2 or 3) */
  numQubits: number;
  /** Ordered list of gates to apply */
  gates: PlacedGate[];
}

/** Response from the backend /simulate endpoint */
export interface SimulationResult {
  /** Map of state label → probability, e.g. {"00": 0.5, "11": 0.5} */
  probabilities: Record<string, number>;
}

/** Error response from the backend */
export interface ApiError {
  detail: string;
}

/** Gate metadata for the palette / tooltips */
export interface GateInfo {
  type: GateType;
  label: string;
  color: string;
  description: string;
}

/** All available gates with educational descriptions */
export const GATE_CATALOG: GateInfo[] = [
  {
    type: "H",
    label: "H",
    color: "#6366f1",
    description:
      "Hadamard gate – puts a qubit into an equal superposition of |0⟩ and |1⟩. It's like flipping a perfectly fair coin.",
  },
  {
    type: "X",
    label: "X",
    color: "#ef4444",
    description:
      "Pauli-X gate – flips |0⟩ to |1⟩ and vice versa. It behaves like a classical NOT gate.",
  },
  {
    type: "Y",
    label: "Y",
    color: "#f59e0b",
    description:
      "Pauli-Y gate – rotates the qubit state around the Y-axis of the Bloch sphere, combining a bit-flip and a phase-flip.",
  },
  {
    type: "Z",
    label: "Z",
    color: "#10b981",
    description:
      "Pauli-Z gate – flips the phase of |1⟩ without changing |0⟩. It adds a minus sign to the |1⟩ component.",
  },
  {
    type: "CX",
    label: "CX",
    color: "#3b82f6",
    description:
      "Controlled-NOT (CNOT) gate – flips the target qubit only if the control qubit is |1⟩. It creates entanglement between two qubits.",
  },
];
