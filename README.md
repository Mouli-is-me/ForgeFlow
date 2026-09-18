# ForgeFlow

ForgeFlow is an interactive manufacturing digital twin for configuring, running, disrupting, analyzing, and comparing production-line scenarios.

## What It Demonstrates

```text
BUILD -> RUN -> OBSERVE -> DISRUPT -> UNDERSTAND -> RECOVER -> EXPERIMENT -> COMPARE
```

The frontend runs a deterministic discrete-time simulation with real machine states, queues, throughput, utilization, downtime, bottleneck analysis, and What-If comparisons.

## Features

- Four-stage deterministic demo factory: Cutting, Assembly, Inspection, and Packaging
- Machine states: `RUNNING`, `IDLE`, `STARVED`, `BLOCKED`, and `DOWN`
- Live queue and throughput visualization
- Dynamic simulation speed from `0.25x` to `10x`
- Machine inspection with causal explanations
- Controlled breakdown, slowdown, and recovery events
- Production health and bottleneck analysis
- Factory Builder templates and custom machine configuration
- Independent baseline-versus-scenario What-If simulations
- Analytics generated from actual simulation history
- FastAPI backend retained as a future data and integration layer

## Run Locally

### Frontend

Requirements: Node.js and npm.

```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Open [http://localhost:5173](http://localhost:5173).

### Backend

The repository includes a Python virtual environment with the backend dependencies.

```powershell
.\venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Backend API and health check:

- [http://localhost:8000/api/health](http://localhost:8000/api/health)
- [http://localhost:8000/docs](http://localhost:8000/docs)

The current frontend simulation is authoritative. The FastAPI service remains decoupled for future persistence, sensor ingestion, and integrations.

## Review Demo

1. Open **Build Factory** and choose **Balanced line** or **Failure propagation**.
2. Start the simulation and watch units, queues, machine states, and throughput.
3. Pause and select a machine to inspect its live condition.
4. Use **Disrupt the factory** to break Inspection for 120 seconds.
5. Resume and observe `DOWN`, queue buildup, downstream starvation, and bottleneck evidence.
6. Recover the machine and watch production resume.
7. Open **What-If Lab**, increase Inspection capacity, and run the independent comparison.
8. Use **Reset** to return to the deterministic initial state.

## Project Structure

```text
backend/
	api/          FastAPI routes
	database/     Database connection and repository layer
	engine/       Backend simulation support
	models/       Backend domain models
frontend/
	src/engine/   Deterministic TypeScript simulation engine
	src/store/    Zustand simulation state
	src/components/ Production line, controls, events, and analytics UI
	src/pages/    Simulate, Factory Builder, What-If, and Analytics views
```

## Validation

Frontend build:

```powershell
cd frontend
npm run build
```

Backend and engine tests:

```powershell
python -m pytest backend/tests -q
```

Operational values shown in the UI come from the simulation engine; no production KPIs or bottleneck results are hard-coded.
