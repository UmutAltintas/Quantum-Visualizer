"""Qiskit circuit builder and AerSimulator runner."""

from __future__ import annotations

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

from .schemas import CircuitPayload, PlacedGate, SimulationResult

# Reusable simulator instance
_simulator = AerSimulator()


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


def build_and_simulate(payload: CircuitPayload, shots: int = 4096) -> SimulationResult:
    """
    Build a Qiskit circuit from the payload, simulate it, and return
    measurement probabilities.

    Parameters
    ----------
    payload : CircuitPayload
        Validated circuit description from the frontend.
    shots : int
        Number of simulation shots (more = smoother probabilities).

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

    # Add measurements on all qubits
    qc.measure_all()

    # Run simulation
    result = _simulator.run(qc, shots=shots).result()
    counts = result.get_counts()

    # Convert counts to probabilities
    probabilities: dict[str, float] = {}

    # Ensure all possible states are present (even zero-probability ones)
    num_states = 2 ** payload.num_qubits
    for i in range(num_states):
        state_label = format(i, f"0{payload.num_qubits}b")
        probabilities[state_label] = counts.get(state_label, 0) / shots

    return SimulationResult(probabilities=probabilities)
