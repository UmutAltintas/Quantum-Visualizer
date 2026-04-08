/* ─── Shared types between frontend and backend ─── */

/** Supported quantum gate identifiers */
export type GateType = "H" | "X" | "Y" | "Z" | "CX" | "Rx" | "Ry" | "Rz" | "SWAP" | "CCX";

/** Gates that require an angle parameter */
export const PARAMETERIZED_GATES: GateType[] = ["Rx", "Ry", "Rz"];

/** Gates that need a control qubit */
export const CONTROLLED_GATES: GateType[] = ["CX"];

/** Gates that span exactly 2 qubits (target + 1 other) */
export const TWO_QUBIT_GATES: GateType[] = ["CX", "SWAP"];

/** Gates that span exactly 3 qubits */
export const THREE_QUBIT_GATES: GateType[] = ["CCX"];

/** A single gate placed on the circuit */
export interface PlacedGate {
  /** Unique id for React keys / drag tracking */
  id: string;
  /** Which gate */
  gate: GateType;
  /** Target qubit index (0-based) */
  target: number;
  /** Control qubit index – used for CX, SWAP */
  control?: number;
  /** Second control qubit index – used for CCX (Toffoli) */
  control2?: number;
  /** Rotation angle in radians – used for Rx, Ry, Rz */
  angle?: number;
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

/** Response from the backend /intermediate-state endpoint */
export interface BlochCoords {
  x: number;
  y: number;
  z: number;
}

export interface IntermediateStateResult {
  probabilities: Record<string, number>;
  bloch_coords: BlochCoords[];
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
  /** LaTeX-style matrix representation for educational tooltips */
  matrix: string;
  /** Number of qubits this gate spans */
  span: number;
  /** Whether the gate takes an angle parameter */
  parameterized: boolean;
}

/** All available gates with educational descriptions */
export const GATE_CATALOG: GateInfo[] = [
  {
    type: "H",
    label: "H",
    color: "#6366f1",
    description:
      "Hadamard gate – puts a qubit into an equal superposition of |0⟩ and |1⟩. It's like flipping a perfectly fair coin.",
    matrix: "1/√2 × [[1, 1], [1, -1]]",
    span: 1,
    parameterized: false,
  },
  {
    type: "X",
    label: "X",
    color: "#ef4444",
    description:
      "Pauli-X gate – flips |0⟩ to |1⟩ and vice versa. It behaves like a classical NOT gate.",
    matrix: "[[0, 1], [1, 0]]",
    span: 1,
    parameterized: false,
  },
  {
    type: "Y",
    label: "Y",
    color: "#f59e0b",
    description:
      "Pauli-Y gate – rotates the qubit state around the Y-axis of the Bloch sphere, combining a bit-flip and a phase-flip.",
    matrix: "[[0, -i], [i, 0]]",
    span: 1,
    parameterized: false,
  },
  {
    type: "Z",
    label: "Z",
    color: "#10b981",
    description:
      "Pauli-Z gate – flips the phase of |1⟩ without changing |0⟩. It adds a minus sign to the |1⟩ component.",
    matrix: "[[1, 0], [0, -1]]",
    span: 1,
    parameterized: false,
  },
  {
    type: "Rx",
    label: "Rx",
    color: "#f472b6",
    description:
      "Rotation-X gate – rotates the qubit around the X-axis of the Bloch sphere by a specified angle θ.",
    matrix: "[[cos(θ/2), -i·sin(θ/2)], [-i·sin(θ/2), cos(θ/2)]]",
    span: 1,
    parameterized: true,
  },
  {
    type: "Ry",
    label: "Ry",
    color: "#fb923c",
    description:
      "Rotation-Y gate – rotates the qubit around the Y-axis of the Bloch sphere by a specified angle θ.",
    matrix: "[[cos(θ/2), -sin(θ/2)], [sin(θ/2), cos(θ/2)]]",
    span: 1,
    parameterized: true,
  },
  {
    type: "Rz",
    label: "Rz",
    color: "#34d399",
    description:
      "Rotation-Z gate – rotates the qubit around the Z-axis of the Bloch sphere by a specified angle θ.",
    matrix: "[[e^(-iθ/2), 0], [0, e^(iθ/2)]]",
    span: 1,
    parameterized: true,
  },
  {
    type: "CX",
    label: "CX",
    color: "#3b82f6",
    description:
      "Controlled-NOT (CNOT) gate – flips the target qubit only if the control qubit is |1⟩. It creates entanglement between two qubits.",
    matrix: "[[1,0,0,0], [0,1,0,0], [0,0,0,1], [0,0,1,0]]",
    span: 2,
    parameterized: false,
  },
  {
    type: "SWAP",
    label: "SW",
    color: "#a78bfa",
    description:
      "SWAP gate – exchanges the quantum states of two qubits. If qubit A is |0⟩ and qubit B is |1⟩, after SWAP they switch.",
    matrix: "[[1,0,0,0], [0,0,1,0], [0,1,0,0], [0,0,0,1]]",
    span: 2,
    parameterized: false,
  },
  {
    type: "CCX",
    label: "CCX",
    color: "#06b6d4",
    description:
      "Toffoli (CCX) gate – flips the target qubit only when both control qubits are |1⟩. It's a universal gate for classical computation.",
    matrix: "8×8 identity with bottom-right 2×2 = [[0,1],[1,0]]",
    span: 3,
    parameterized: false,
  },
];
