"""Simulation API routes."""

from fastapi import APIRouter, HTTPException

from ..schemas import (
    ChallengeVerifyPayload,
    ChallengeVerifyResult,
    CircuitPayload,
    IntermediateStatePayload,
    IntermediateStateResult,
    SimulationResult,
)
from ..simulator import build_and_simulate, intermediate_state, verify_challenge, CHALLENGES

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


@router.post("/verify-challenge", response_model=ChallengeVerifyResult)
async def verify(payload: ChallengeVerifyPayload) -> ChallengeVerifyResult:
    try:
        result = verify_challenge(payload.challenge_id, payload.num_qubits, payload.gates)
        return ChallengeVerifyResult(**result)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Challenge verification failed: {exc}")


@router.get("/challenges")
async def list_challenges() -> list[dict]:
    return [
        {"id": k, "title": v["title"], "description": v["description"], "numQubits": v["num_qubits"]}
        for k, v in CHALLENGES.items()
    ]
