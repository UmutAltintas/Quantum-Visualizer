"""Pydantic schemas – the strict contract between frontend and backend."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


GateType = Literal["H", "X", "Y", "Z", "CX"]


class PlacedGate(BaseModel):
    """A single gate placed on the circuit."""

    id: str = Field(..., description="Unique identifier for the gate instance")
    gate: GateType = Field(..., description="Gate type identifier")
    target: int = Field(..., ge=0, description="Target qubit index (0-based)")
    control: Optional[int] = Field(
        None, ge=0, description="Control qubit index – required for CX"
    )
    step: int = Field(..., ge=0, description="Time-step column on the circuit")

    @field_validator("control")
    @classmethod
    def cx_needs_control(cls, v: Optional[int], info) -> Optional[int]:  # noqa: N805
        gate = info.data.get("gate")
        if gate == "CX" and v is None:
            raise ValueError("CX gate requires a control qubit")
        if gate != "CX" and v is not None:
            raise ValueError(f"control qubit is not applicable for {gate} gate")
        return v


class CircuitPayload(BaseModel):
    """Request body for the /simulate endpoint."""

    num_qubits: int = Field(..., ge=2, le=3, alias="numQubits")
    gates: list[PlacedGate] = Field(
        ..., description="Ordered list of gates to apply"
    )


class SimulationResult(BaseModel):
    """Response from the /simulate endpoint."""

    probabilities: dict[str, float] = Field(
        ..., description="State label → probability map"
    )
