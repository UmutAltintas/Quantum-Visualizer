import {
  CircuitPayload,
  SimulationResult,
  IntermediateStateResult,
  ChallengeVerifyPayload,
  ChallengeVerifyResult,
  ApiError,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Generic fetch helper with error handling */
async function apiFetch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = "Request failed. Please check your circuit.";
    try {
      const err: ApiError = await res.json();
      message = err.detail;
    } catch {
      // response wasn't JSON – use generic message
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

/**
 * Sends the circuit to the backend for Qiskit simulation.
 */
export async function simulateCircuit(
  payload: CircuitPayload
): Promise<SimulationResult> {
  return apiFetch<SimulationResult>("/simulate", payload);
}

/**
 * Gets the intermediate single-qubit statevector at a specific step.
 */
export async function getIntermediateState(
  payload: CircuitPayload,
  qubitIndex: number,
  atStep: number
): Promise<IntermediateStateResult> {
  return apiFetch<IntermediateStateResult>("/intermediate-state", {
    ...payload,
    qubitIndex,
    atStep,
  });
}

/**
 * Verifies a user's circuit against a challenge target state.
 */
export async function verifyChallenge(
  payload: ChallengeVerifyPayload
): Promise<ChallengeVerifyResult> {
  return apiFetch<ChallengeVerifyResult>("/verify-challenge", payload);
}
