"""Simulation API route."""

from fastapi import APIRouter, HTTPException

from ..schemas import CircuitPayload, SimulationResult
from ..simulator import build_and_simulate

router = APIRouter()


@router.post("/simulate", response_model=SimulationResult)
async def simulate(payload: CircuitPayload) -> SimulationResult:
    """
    Accept a circuit description, run it through the Qiskit AerSimulator,
    and return measurement probabilities.
    """
    try:
        return build_and_simulate(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Simulation failed: {exc}",
        )
