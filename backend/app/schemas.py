"""Pydantic schemas – the strict contract between frontend and backend."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


GateType = Literal["H", "X", "Y", "Z", "CX", "Rx", "Ry", "Rz", "SWAP", "CCX"]

CONTROLLED_GATES = {"CX", "SWAP", "CCX"}
PARAMETERIZED_GATES = {"Rx", "Ry", "Rz"}
TWO_QUBIT_GATES = {"CX", "SWAP"}
THREE_QUBIT_GATES = {"CCX"}


class PlacedGate(BaseModel):
    """A single gate placed on the circuit."""

    id: str = Field(..., description="Unique identifier for the gate instance")
    gate: GateType = Field(..., description="Gate type identifier")
    target: int = Field(..., ge=0, description="Target qubit index (0-based)")
    control: Optional[int] = Field(
        None, ge=0, description="Control qubit index"
    )
    control2: Optional[int] = Field(
        None, ge=0, description="Second control qubit – required for CCX"
    )
    step: int = Field(..., ge=0, description="Time-step column on the circuit")
    angle: Optional[float] = Field(
        None, description="Rotation angle in radians – required for Rx/Ry/Rz"
    )

    @model_validator(mode="after")
    def validate_gate_fields(self) -> "PlacedGate":
        g = self.gate
        if g in CONTROLLED_GATES and self.control is None:
            raise ValueError(f"{g} gate requires a control qubit")
        if g not in CONTROLLED_GATES and self.control is not None:
            raise ValueError(f"control qubit is not applicable for {g} gate")
        if g in THREE_QUBIT_GATES and self.control2 is None:
            raise ValueError(f"{g} gate requires a second control qubit (control2)")
        if g not in THREE_QUBIT_GATES and self.control2 is not None:
            raise ValueError(f"control2 is not applicable for {g} gate")
        if g in PARAMETERIZED_GATES and self.angle is None:
            raise ValueError(f"{g} gate requires an angle parameter")
        return self


class CircuitPayload(BaseModel):
    """Request body for the /simulate endpoint."""

    num_qubits: int = Field(..., ge=1, le=8, alias="numQubits")
    gates: list[PlacedGate] = Field(
        ..., description="Ordered list of gates to apply"
    )


class SimulationResult(BaseModel):
    """Response from the /simulate endpoint."""

    probabilities: dict[str, float] = Field(
        ..., description="State label → probability map"
    )


class IntermediateStatePayload(BaseModel):
    """Request body for the /intermediate-state endpoint."""

    num_qubits: int = Field(..., ge=1, le=8, alias="numQubits")
    gates: list[PlacedGate]
    up_to_step: int = Field(..., ge=0, alias="upToStep")


class BlochCoords(BaseModel):
    x: float
    y: float
    z: float


class IntermediateStateResult(BaseModel):
    probabilities: dict[str, float]
    bloch_coords: list[BlochCoords] = Field(
        ..., description="Bloch sphere coords per qubit"
    )
