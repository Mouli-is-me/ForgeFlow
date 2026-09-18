import json
from backend.models.domain import LineConfig, MachineConfig, SimulationEvent, ComparisonResult
from backend.engine.simulator import SimulationEngine

def get_base_config():
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

def compare_results(baseline, scenario) -> ComparisonResult:
    return ComparisonResult(
        baseline_throughput=baseline.throughput,
        scenario_throughput=scenario.throughput,
        throughput_delta=round(scenario.throughput - baseline.throughput, 2),
        throughput_delta_percent=round(((scenario.throughput - baseline.throughput) / baseline.throughput) * 100, 2) if baseline.throughput else 0,
        baseline_production=baseline.production,
        scenario_production=scenario.production,
        production_loss=round(baseline.production - scenario.production, 2),
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

def run_scenarios():
    config = get_base_config()

    print("=== 1. BASELINE SIMULATION ===")
    baseline_result = SimulationEngine(config).run(1440)
    print(baseline_result.model_dump_json(indent=2))

    print("\n=== 2. M3 REDUCED CAPACITY (-20%) ===")
    red_result = SimulationEngine(config, events=[
        SimulationEvent(tick=61, type="capacity_change", machine_id="M3", value=0.8)
    ]).run(1440)
    comp_red = compare_results(baseline_result, red_result)
    print(comp_red.model_dump_json(indent=2))

    print("\n=== 3. M3 30-MIN DOWNTIME ===")
    down_result = SimulationEngine(config, events=[
        SimulationEvent(tick=300, type="downtime", machine_id="M3", duration=30)
    ]).run(1440)
    comp_down = compare_results(baseline_result, down_result)
    print(comp_down.model_dump_json(indent=2))

    print("\n=== 4. M3 UPGRADED TO 100 ===")
    upg_result = SimulationEngine(config, events=[
        SimulationEvent(tick=61, type="capacity_change", machine_id="M3", value=(100.0/60.0))
    ]).run(1440)
    comp_upg = compare_results(baseline_result, upg_result)
    print(comp_upg.model_dump_json(indent=2))

if __name__ == "__main__":
    run_scenarios()
