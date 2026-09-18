from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from backend.models.domain import SimulationEvent, SimulationResult, ComparisonResult
from backend.engine.simulator import SimulationEngine
from backend.api.routes_line import get_base_config
from backend.database.repository import save_simulation

router = APIRouter()

class RunRequest(BaseModel):
    duration_minutes: int = 1440
    events: List[SimulationEvent] = []
    
    # Adding validation
    def model_post_init(self, __context):
        if self.duration_minutes <= 0:
            raise ValueError("Duration must be positive")
        for e in self.events:
            if e.type not in ["capacity_change", "downtime", "processing_time_change"]:
                raise ValueError(f"Invalid event type: {e.type}")

class WhatIfRequest(BaseModel):
    duration_minutes: int = 1440
    events: List[SimulationEvent]
    scenario_name: str = "Custom Scenario"

def create_comparison(baseline: SimulationResult, scenario: SimulationResult) -> ComparisonResult:
    return ComparisonResult(
        baseline_throughput=baseline.throughput,
        scenario_throughput=scenario.throughput,
        throughput_delta=round(scenario.throughput - baseline.throughput, 2),
        throughput_delta_percent=round(((scenario.throughput - baseline.throughput) / baseline.throughput) * 100, 2) if baseline.throughput else 0,
        baseline_production=baseline.production,
        scenario_production=scenario.production,
        production_delta=round(scenario.production - baseline.production, 2),
        production_loss=round(max(0, baseline.production - scenario.production), 2),
        baseline_bottleneck=baseline.bottleneck.machine,
        scenario_bottleneck=scenario.bottleneck.machine,
        machine_utilization_changes={
            m: {
                "base": baseline.machine_utilization[m].capacity_utilization,
                "scenario": scenario.machine_utilization[m].capacity_utilization
            } for m in baseline.machine_utilization
        },
        buffer_utilization_changes={
            b: {
                "base": baseline.buffer_utilization[b],
                "scenario": scenario.buffer_utilization[b]
            } for b in baseline.buffer_utilization
        },
        downtime_impact=scenario.downtime_impact,
        propagation_events=scenario.propagation_events,
        detected_inefficiencies=scenario.detected_inefficiencies,
        possible_interventions=scenario.possible_interventions
    )

@router.post("/run", response_model=SimulationResult)
def run_simulation(req: RunRequest):
    try:
        config = get_base_config()
        engine = SimulationEngine(config, req.events)
        result = engine.run(req.duration_minutes)
        
        save_simulation(
            run_type="baseline" if not req.events else "custom_run", 
            duration=req.duration_minutes, 
            result=result
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/what-if", response_model=ComparisonResult)
def run_what_if(req: WhatIfRequest):
    try:
        if req.duration_minutes <= 0:
            raise ValueError("Duration must be positive")
            
        config = get_base_config()
        
        # Run baseline
        base_engine = SimulationEngine(config, [])
        baseline_result = base_engine.run(req.duration_minutes)
        
        # Run scenario
        scenario_engine = SimulationEngine(config, req.events)
        scenario_result = scenario_engine.run(req.duration_minutes)
        
        comp = create_comparison(baseline_result, scenario_result)
        
        save_simulation(
            run_type="what-if", 
            duration=req.duration_minutes, 
            result=comp,
            scenario_summary=req.scenario_name
        )
        return comp
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
