"""Qiskit circuit builder and Statevector-based simulator."""

from __future__ import annotations

import math

import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector, partial_trace, DensityMatrix

from .schemas import (
    BlochCoords,
    CircuitPayload,
    IntermediateStatePayload,
    IntermediateStateResult,
    PlacedGate,
    SimulationResult,
)


def _validate_qubit(index: int, label: str, num_qubits: int) -> None:
    if index >= num_qubits:
        raise ValueError(
            f"{label} qubit {index} is out of range "
            f"for a {num_qubits}-qubit circuit"
        )


def _apply_gate(qc: QuantumCircuit, gate: PlacedGate) -> None:
    """Apply a single gate to the Qiskit QuantumCircuit."""
    match gate.gate:
        case "H":
            qc.h(gate.target)
        case "X":
            qc.x(gate.target)
        case "Y":
            qc.y(gate.target)
        case "Z":
            qc.z(gate.target)
        case "Rx":
            qc.rx(gate.angle, gate.target)
        case "Ry":
            qc.ry(gate.angle, gate.target)
        case "Rz":
            qc.rz(gate.angle, gate.target)
        case "CX":
            assert gate.control is not None
            qc.cx(gate.control, gate.target)
        case "SWAP":
            assert gate.control is not None
            qc.swap(gate.control, gate.target)
        case "CCX":
            assert gate.control is not None and gate.control2 is not None
            qc.ccx(gate.control, gate.control2, gate.target)


def _build_circuit(num_qubits: int, gates: list[PlacedGate], up_to_step: int | None = None) -> QuantumCircuit:
    """Build a Qiskit circuit from a gate list, optionally up to a certain step."""
    qc = QuantumCircuit(num_qubits)
    sorted_gates = sorted(gates, key=lambda g: g.step)

    for gate in sorted_gates:
        if up_to_step is not None and gate.step > up_to_step:
            break
        _validate_qubit(gate.target, f"Gate {gate.gate} target", num_qubits)
        if gate.control is not None:
            _validate_qubit(gate.control, f"{gate.gate} control", num_qubits)
        if gate.control2 is not None:
            _validate_qubit(gate.control2, f"{gate.gate} control2", num_qubits)
        _apply_gate(qc, gate)

    return qc


def _statevector_probabilities(sv: Statevector, num_qubits: int) -> dict[str, float]:
    probs_dict = sv.probabilities_dict()
    probabilities: dict[str, float] = {}
    for i in range(2 ** num_qubits):
        state_label = format(i, f"0{num_qubits}b")
        probabilities[state_label] = round(probs_dict.get(state_label, 0.0), 6)
    return probabilities


def _bloch_coords(sv: Statevector, num_qubits: int) -> list[BlochCoords]:
    """Compute Bloch sphere coordinates for each qubit by tracing out others."""
    coords: list[BlochCoords] = []
    dm = DensityMatrix(sv)
    for qubit in range(num_qubits):
        # Trace out all qubits except this one
        other_qubits = [q for q in range(num_qubits) if q != qubit]
        if other_qubits:
            reduced = partial_trace(dm, other_qubits)
        else:
            reduced = dm
        rho = reduced.data
        # Bloch vector: x = 2*Re(ρ₀₁), y = 2*Im(ρ₀₁), z = Re(ρ₀₀ - ρ₁₁)
        x = float(2 * np.real(rho[0, 1]))
        y = float(2 * np.imag(rho[0, 1]))
        z = float(np.real(rho[0, 0] - rho[1, 1]))
        coords.append(BlochCoords(x=round(x, 6), y=round(y, 6), z=round(z, 6)))
    return coords


def build_and_simulate(payload: CircuitPayload) -> SimulationResult:
    """Build a circuit, compute statevector, return probabilities."""
    qc = _build_circuit(payload.num_qubits, payload.gates)
    sv = Statevector.from_instruction(qc)
    return SimulationResult(probabilities=_statevector_probabilities(sv, payload.num_qubits))


def intermediate_state(payload: IntermediateStatePayload) -> IntermediateStateResult:
    """Return probabilities and Bloch coords up to a given step."""
    qc = _build_circuit(payload.num_qubits, payload.gates, payload.up_to_step)
    sv = Statevector.from_instruction(qc)
    return IntermediateStateResult(
        probabilities=_statevector_probabilities(sv, payload.num_qubits),
        bloch_coords=_bloch_coords(sv, payload.num_qubits),
    )


# ── Challenge definitions ────────────────────────────────────────

CHALLENGES: dict[str, dict] = {
    "bell-state": {
        "title": "Create a Bell State",
        "description": "Produce the state (|00⟩ + |11⟩)/√2 using 2 qubits.",
        "num_qubits": 2,
        "expected": {"00": 0.5, "01": 0.0, "10": 0.0, "11": 0.5},
        "tolerance": 0.01,
    },
    "ghz-state": {
        "title": "Create a GHZ State",
        "description": "Produce the state (|000⟩ + |111⟩)/√2 using 3 qubits.",
        "num_qubits": 3,
        "expected": {"000": 0.5, "001": 0.0, "010": 0.0, "011": 0.0,
                     "100": 0.0, "101": 0.0, "110": 0.0, "111": 0.5},
        "tolerance": 0.01,
    },
    "superposition": {
        "title": "Equal Superposition",
        "description": "Put all 2 qubits into equal superposition (each basis state = 25%).",
        "num_qubits": 2,
        "expected": {"00": 0.25, "01": 0.25, "10": 0.25, "11": 0.25},
        "tolerance": 0.01,
    },
}


def verify_challenge(challenge_id: str, num_qubits: int, gates: list[PlacedGate]) -> dict:
    """Check if the user's circuit solves a challenge."""
    challenge = CHALLENGES.get(challenge_id)
    if not challenge:
        raise ValueError(f"Unknown challenge: {challenge_id}")

    qc = _build_circuit(num_qubits, gates)
    sv = Statevector.from_instruction(qc)
    actual = _statevector_probabilities(sv, num_qubits)
    expected = challenge["expected"]
    tol = challenge["tolerance"]

    passed = all(
        abs(actual.get(k, 0.0) - v) <= tol for k, v in expected.items()
    )
    message = "Correct! Well done!" if passed else "Not quite – check your circuit and try again."

    return {"passed": passed, "expected": expected, "actual": actual, "message": message}
