from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class SimulationEvent(BaseModel):
    tick: int
    type: str  # "downtime", "capacity_change", "processing_time_change"
    machine_id: str
    duration: Optional[int] = None
    value: Optional[float] = None

class MachineConfig(BaseModel):
    id: str
    name: str
    capacity_per_hour: float

class LineConfig(BaseModel):
    machines: List[MachineConfig]
    buffer_capacity: float = 100.0  # standard buffer capacity between stages
    warmup_minutes: int = 60 # Default warm-up period to reach steady state

class BottleneckAnalysis(BaseModel):
    machine: str
    reason: str
    effective_capacity: float
    line_throughput: float
    upstream_queue_pressure: float
    downstream_queue_pressure: float

class MachineUtilization(BaseModel):
    capacity_utilization: float # (units processed / max theoretical units) * 100
    time_utilization: float     # (time running / total time) * 100

class SimulationResult(BaseModel):
    throughput: float
    production: float
    bottleneck: BottleneckAnalysis
    machine_utilization: Dict[str, MachineUtilization]
    buffer_utilization: Dict[str, float]
    downtime_impact: Dict[str, float]
    propagation_events: List[Dict[str, Any]]
    queue_changes: Dict[str, Any]
    detected_inefficiencies: List[str]
    possible_interventions: List[str]
    time_series: List[Dict[str, Any]] = []

class ComparisonResult(BaseModel):
    baseline_throughput: float
    scenario_throughput: float
    throughput_delta: float
    throughput_delta_percent: float
    
    baseline_production: float
    scenario_production: float
    production_delta: float
    production_loss: float
    
    baseline_bottleneck: str
    scenario_bottleneck: str
    
    machine_utilization_changes: Dict[str, Any]
    buffer_utilization_changes: Dict[str, Any]
    downtime_impact: Dict[str, float]
    
    propagation_events: List[Dict[str, Any]]
    detected_inefficiencies: List[str]
    possible_interventions: List[str]
