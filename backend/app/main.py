"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.simulate import router as simulate_router

app = FastAPI(
    title="Quantum Algorithm Visualizer API",
    description="Backend for simulating quantum circuits with Qiskit",
    version="0.1.0",
)

# CORS – allow the Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulate_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
