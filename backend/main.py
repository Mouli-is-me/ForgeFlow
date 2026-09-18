from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database.connection import init_db
from backend.api import routes_line, routes_simulation, routes_history

app = FastAPI(
    title="FORGEFLOW TWIN API",
    description="Digital Twin Simulation Engine for Production Line Bottleneck Analysis",
    version="1.0.0"
)

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "FORGEFLOW TWIN API is running"}

app.include_router(routes_line.router, prefix="/api/line", tags=["Line Configuration"])
app.include_router(routes_simulation.router, prefix="/api/simulation", tags=["Simulation"])
app.include_router(routes_history.router, prefix="/api/history", tags=["History"])
