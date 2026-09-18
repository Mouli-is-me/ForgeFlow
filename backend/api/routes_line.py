from fastapi import APIRouter
from backend.models.domain import LineConfig, MachineConfig

router = APIRouter()

def get_base_config() -> LineConfig:
    return LineConfig(
        machines=[
            MachineConfig(id="M1", name="Cutting", capacity_per_hour=100.0),
            MachineConfig(id="M2", name="Spinning", capacity_per_hour=90.0),
            MachineConfig(id="M3", name="Processing", capacity_per_hour=60.0),
            MachineConfig(id="M4", name="Finishing", capacity_per_hour=85.0),
            MachineConfig(id="M5", name="Packing", capacity_per_hour=90.0),
        ],
        buffer_capacity=100.0,
        warmup_minutes=60
    )

@router.get("/status", response_model=LineConfig)
def get_line_status():
    """Returns the current baseline configuration of the production line."""
    return get_base_config()
