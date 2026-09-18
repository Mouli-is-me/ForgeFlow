from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from backend.database.repository import get_history, get_simulation_by_id

router = APIRouter()

@router.get("", response_model=List[Dict[str, Any]])
def list_history():
    """Returns a list of previous simulation runs."""
    return get_history()

@router.get("/{sim_id}", response_model=Dict[str, Any])
def get_simulation(sim_id: str):
    """Returns the complete persisted result for a selected simulation."""
    data = get_simulation_by_id(sim_id)
    if not data:
        raise HTTPException(status_code=404, detail="Simulation run not found")
    return data
