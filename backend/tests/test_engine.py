import pytest
from backend.models.domain import LineConfig, MachineConfig, SimulationEvent
from backend.engine.simulator import SimulationEngine

def get_baseline_config():
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

def test_baseline_bottleneck_is_m3():
    config = get_baseline_config()
    engine = SimulationEngine(config)
    result = engine.run(1440)
    
    assert result.bottleneck.machine == "M3"
    assert result.production == pytest.approx(1440.0, rel=0.01)
    assert result.throughput == pytest.approx(60.0, rel=0.01)
    
    # Check that warmup eliminated artificial starvation
    propagations = [e for e in result.propagation_events if e["tick"] == 1]
    assert len(propagations) == 0, "There should be no starvation at tick 1 due to warmup"

    assert result.machine_utilization["M3"].capacity_utilization == pytest.approx(100.0, rel=0.01)

def test_m3_capacity_reduction():
    config = get_baseline_config()
    # Event applies AFTER warmup (warmup is 60 ticks, so tick 61 is the first real recorded tick)
    events = [
        SimulationEvent(tick=61, type="capacity_change", machine_id="M3", value=0.8)
    ]
    engine = SimulationEngine(config, events)
    result = engine.run(1440)
    
    assert result.bottleneck.machine == "M3"
    assert result.production < 1440.0 # Throughput decreases
    assert result.throughput == pytest.approx(48.0, rel=0.01) # 60 * 0.8 = 48
    
    # Upstream accumulation should be very high
    assert result.buffer_utilization["B2"] > 90.0

def test_m3_30_min_downtime():
    config = get_baseline_config()
    events = [
        SimulationEvent(tick=300, type="downtime", machine_id="M3", duration=30)
    ]
    engine = SimulationEngine(config, events)
    result = engine.run(1440)
    
    # 1440 - (30 * (60/60)) = 1410
    assert result.production == pytest.approx(1410.0, rel=0.01)
    assert result.downtime_impact.get("M3") == 30
    
    types = [e["type"] for e in result.propagation_events]
    assert "downtime_started" in types
    # M4 is already structurally starved by M3 during normal operation, so we don't 
    # necessarily see a state transition to "starved". 
    # M2 produces at 90, so it would take > 60 mins to fill the 100-unit buffer B2.
    # Therefore, 30 mins downtime doesn't block M2 either!

def test_m3_capacity_increased_dynamically_shifts_bottleneck():
    config = get_baseline_config()
    # Use smaller buffers so the line reaches steady state quickly
    config.buffer_capacity = 10.0
    events = [
        # Boost M3 capacity to 100 units/hour starting at minute 1 of recorded time
        SimulationEvent(tick=61, type="capacity_change", machine_id="M3", value=(100.0/60.0))
    ]
    engine = SimulationEngine(config, events)
    result = engine.run(1440)
    
    # If M3 is 100, M1 is 100, M2 is 90, M4 is 85, M5 is 90
    # With small buffers, M2 will fill the buffers and then be blocked by M4's slower rate.
    # Therefore, M4 will operate at 100% capacity utilization, and M2 will drop to ~94%.
    # The new bottleneck MUST be M4 (85).
    assert result.bottleneck.machine == "M4"
    assert result.throughput == pytest.approx(85.0, rel=0.5)
