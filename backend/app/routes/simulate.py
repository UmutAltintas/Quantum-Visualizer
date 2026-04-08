"""Simulation API routes."""

from fastapi import APIRouter, HTTPException

from ..schemas import (
    CircuitPayload,
    IntermediateStatePayload,
    IntermediateStateResult,
    SimulationResult,
)
from ..simulator import build_and_simulate, intermediate_state

router = APIRouter()


@router.post("/simulate", response_model=SimulationResult)
async def simulate(payload: CircuitPayload) -> SimulationResult:
    try:
        return build_and_simulate(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {exc}")


@router.post("/intermediate-state", response_model=IntermediateStateResult)
async def get_intermediate_state(payload: IntermediateStatePayload) -> IntermediateStateResult:
    try:
        return intermediate_state(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Intermediate state failed: {exc}")
