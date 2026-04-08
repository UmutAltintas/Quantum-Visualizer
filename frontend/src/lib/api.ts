import { CircuitPayload, SimulationResult, ApiError } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Sends the circuit to the backend for Qiskit simulation.
 * Throws an error with a user-friendly message on failure.
 */
export async function simulateCircuit(
  payload: CircuitPayload
): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Simulation failed. Please check your circuit.";
    try {
      const err: ApiError = await res.json();
      message = err.detail;
    } catch {
      // response wasn't JSON – use generic message
    }
    throw new Error(message);
  }

  return res.json() as Promise<SimulationResult>;
}
