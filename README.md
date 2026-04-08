# Quantum Algorithm Visualizer

An educational tool that teaches high school students the fundamentals of quantum computing by visualizing how quantum gates manipulate qubit states.

## Architecture

```
Quantum-Visualizer/
├── frontend/          # Next.js + TypeScript + Tailwind CSS
│   └── src/
│       ├── components/  # React components (circuit, gates, charts)
│       ├── lib/         # Shared types, API client
│       └── app/         # Next.js app router pages
├── backend/           # Python FastAPI + Qiskit
│   ├── app/
│   │   ├── main.py      # FastAPI application entry
│   │   ├── schemas.py   # Pydantic models (shared contract)
│   │   ├── simulator.py # Qiskit circuit builder & simulator
│   │   └── routes/      # API route handlers
│   └── requirements.txt
└── README.md
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`, the backend on `http://localhost:8000`.

## Features (MVP)

- **Circuit Interface**: Visual 2–3 qubit circuit with horizontal wires
- **Gate Library**: Drag-and-drop palette with H, X, Y, Z, and CX gates
- **Simulation**: Qiskit-powered local simulation via AerSimulator
- **Visualization**: Animated bar chart of measurement probabilities
- **Educational UX**: Tooltip explanations for every gate