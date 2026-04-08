"""Qiskit circuit builder and Statevector-based simulator."""

from __future__ import annotations

from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

from .schemas import CircuitPayload, PlacedGate, SimulationResult


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
        case "CX":
            assert gate.control is not None
            qc.cx(gate.control, gate.target)


def build_and_simulate(payload: CircuitPayload) -> SimulationResult:
    """
    Build a Qiskit circuit from the payload, compute the statevector,
    and return exact measurement probabilities.

    Uses Qiskit's Statevector class for a deterministic, noiseless
    simulation – ideal for educational visualization.

    Parameters
    ----------
    payload : CircuitPayload
        Validated circuit description from the frontend.

    Returns
    -------
    SimulationResult
        Probability distribution over computational basis states.
    """
    qc = QuantumCircuit(payload.num_qubits)

    # Sort gates by step so they're applied in the correct temporal order
    sorted_gates = sorted(payload.gates, key=lambda g: g.step)

    for gate in sorted_gates:
        # Validate qubit indices are within bounds
        if gate.target >= payload.num_qubits:
            raise ValueError(
                f"Gate {gate.gate} targets qubit {gate.target}, "
                f"but circuit only has {payload.num_qubits} qubits"
            )
        if gate.control is not None and gate.control >= payload.num_qubits:
            raise ValueError(
                f"CX control qubit {gate.control} is out of range "
                f"for a {payload.num_qubits}-qubit circuit"
            )
        _apply_gate(qc, gate)

    # Get exact probabilities from statevector
    sv = Statevector.from_instruction(qc)
    probs_dict = sv.probabilities_dict()

    # Ensure all basis states are present
    probabilities: dict[str, float] = {}
    num_states = 2 ** payload.num_qubits
    for i in range(num_states):
        state_label = format(i, f"0{payload.num_qubits}b")
        probabilities[state_label] = round(probs_dict.get(state_label, 0.0), 6)

    return SimulationResult(probabilities=probabilities)
