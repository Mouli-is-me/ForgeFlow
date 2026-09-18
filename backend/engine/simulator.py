from typing import List, Dict, Any, Optional
from backend.models.domain import LineConfig, SimulationEvent, SimulationResult, BottleneckAnalysis, MachineUtilization

class BufferState:
    def __init__(self, id: str, capacity: float):
        self.id = id
        self.capacity = capacity
        self.current = 0.0
        self.max_observed = 0.0
        self.total_observed = 0.0
        
    def add(self, amount: float):
        self.current += amount
        if self.current > self.max_observed:
            self.max_observed = self.current

    def take(self, amount: float):
        self.current -= amount
        
    def reset_metrics(self):
        self.max_observed = self.current
        self.total_observed = 0.0

class MachineState:
    def __init__(self, id: str, capacity_per_hour: float):
        self.id = id
        self.base_capacity_per_min = capacity_per_hour / 60.0
        self.capacity_multiplier = 1.0
        
        # State tracking
        self.processed = 0.0
        self.theoretical_processed = 0.0
        self.time_running = 0
        self.time_starved = 0
        self.time_blocked = 0
        self.time_down = 0
        
        self.current_downtime_left = 0
        self.status = "RUNNING" # "RUNNING", "DOWN", "STARVED", "BLOCKED"

    @property
    def effective_capacity_per_min(self) -> float:
        if self.current_downtime_left > 0:
            return 0.0
        return self.base_capacity_per_min * self.capacity_multiplier

    def reset_metrics(self):
        self.processed = 0.0
        self.theoretical_processed = 0.0
        self.time_running = 0
        self.time_starved = 0
        self.time_blocked = 0
        self.time_down = 0

class SimulationEngine:
    def __init__(self, config: LineConfig, events: List[SimulationEvent] = None):
        self.config = config
        self.events = events or []
        
        self.machines = [MachineState(m.id, m.capacity_per_hour) for m in config.machines]
        self.buffers = [BufferState(f"B{i+1}", config.buffer_capacity) for i in range(len(self.machines) - 1)]
        
        self.current_tick = 0
        self.propagation_events = []
        self.time_series = []
        self.is_warmup = True

    def run(self, duration_minutes: int) -> SimulationResult:
        warmup = self.config.warmup_minutes
        
        for tick in range(1, duration_minutes + 1 + warmup):
            self.current_tick = tick
            self._apply_events()
            self._simulate_tick()
            
            # At the end of the warmup period, reset all metrics to discard startup transients
            if tick == warmup:
                self.is_warmup = False
                self.propagation_events.clear()
                self.time_series.clear()
                for m in self.machines:
                    m.reset_metrics()
                for b in self.buffers:
                    b.reset_metrics()
                    
        return self._generate_results(duration_minutes)

    def _apply_events(self):
        active_events = [e for e in self.events if e.tick == self.current_tick]
        for event in active_events:
            machine = next((m for m in self.machines if m.id == event.machine_id), None)
            if not machine:
                continue
                
            if event.type == "downtime":
                machine.current_downtime_left = event.duration
                if not self.is_warmup:
                    self.propagation_events.append({
                        "tick": self.current_tick,
                        "type": "downtime_started",
                        "machine": machine.id,
                        "duration": event.duration
                    })
            elif event.type == "capacity_change":
                machine.capacity_multiplier = event.value
            elif event.type == "processing_time_change":
                machine.capacity_multiplier = 1.0 / event.value

    def _simulate_tick(self):
        # 1. Process flow
        starting_buffer_levels = [b.current for b in self.buffers]
        flows = []
        
        for i, m in enumerate(self.machines):
            capacity = m.effective_capacity_per_min
            if not self.is_warmup:
                m.theoretical_processed += capacity
            
            if capacity == 0:
                flows.append(0.0)
                m.time_down += 1
                m.status = "DOWN"
                continue
                
            available_input = float('inf') if i == 0 else starting_buffer_levels[i-1]
            available_space = float('inf') if i == len(self.machines) - 1 else self.buffers[i].capacity - starting_buffer_levels[i]
            
            flow = min(capacity, available_input, available_space)
            flows.append(flow)
            
            if flow < capacity:
                if available_input <= available_space:
                    # STARVED by upstream
                    if m.status != "STARVED" and available_input == 0 and i > 0 and not self.is_warmup:
                        self.propagation_events.append({
                            "tick": self.current_tick,
                            "type": "starved",
                            "machine": m.id,
                            "buffer": self.buffers[i-1].id,
                            "cause": self.machines[i-1].id
                        })
                    m.time_starved += 1
                    m.status = "STARVED"
                else:
                    # BLOCKED by downstream
                    if m.status != "BLOCKED" and available_space == 0 and i < len(self.machines) - 1 and not self.is_warmup:
                        self.propagation_events.append({
                            "tick": self.current_tick,
                            "type": "blocked",
                            "machine": m.id,
                            "buffer": self.buffers[i].id,
                            "cause": self.machines[i+1].id
                        })
                    m.time_blocked += 1
                    m.status = "BLOCKED"
            else:
                m.time_running += 1
                m.status = "RUNNING"
                
        # 2. Apply flows
        for i, m in enumerate(self.machines):
            flow = flows[i]
            if flow > 0:
                m.processed += flow
                if i > 0:
                    self.buffers[i-1].take(flow)
                if i < len(self.machines) - 1:
                    self.buffers[i].add(flow)
                    
        # 3. Decrement downtimes
        for m in self.machines:
            if m.current_downtime_left > 0:
                m.current_downtime_left -= 1
                    
        # 4. Record buffer usage
        if not self.is_warmup:
            for b in self.buffers:
                b.total_observed += b.current
                
            self.time_series.append({
                "tick": self.current_tick - self.config.warmup_minutes,
                "throughput_so_far": self.machines[-1].processed,
                "buffers": {b.id: b.current for b in self.buffers},
                "machine_status": {m.id: m.status for m in self.machines}
            })

    def _generate_results(self, duration_minutes: int) -> SimulationResult:
        machine_utilization = {}
        for m in self.machines:
            max_possible = m.theoretical_processed
            cap_util = (m.processed / max_possible) * 100 if max_possible > 0 else 0
            time_util = (m.time_running / duration_minutes) * 100 if duration_minutes > 0 else 0
            
            machine_utilization[m.id] = MachineUtilization(
                capacity_utilization=round(cap_util, 2),
                time_utilization=round(time_util, 2)
            )
            
        buffer_utilization = {}
        for b in self.buffers:
            avg_level = b.total_observed / duration_minutes if duration_minutes > 0 else 0
            buffer_utilization[b.id] = round((avg_level / b.capacity) * 100, 2)
            
        final_production = self.machines[-1].processed if self.machines else 0.0
        hourly_throughput = (final_production / duration_minutes) * 60 if duration_minutes > 0 else 0.0
            
        # Bottleneck detection: 
        # Identify the machine with the highest capacity utilization that is effectively restricting flow.
        # This machine typically has high capacity_utilization, creates upstream accumulation, and starves downstream.
        bottleneck_machine = max(self.machines, key=lambda m: machine_utilization[m.id].capacity_utilization)
        
        idx = self.machines.index(bottleneck_machine)
        up_pressure = buffer_utilization[self.buffers[idx-1].id] if idx > 0 else 100.0
        down_pressure = buffer_utilization[self.buffers[idx].id] if idx < len(self.machines) - 1 else 0.0
        
        reason = (f"{bottleneck_machine.id} has the highest capacity utilization ({machine_utilization[bottleneck_machine.id].capacity_utilization}%) "
                  f"and lowest effective capacity, creating a bottleneck. Upstream buffer is {up_pressure}% full.")
                  
        bottleneck = BottleneckAnalysis(
            machine=bottleneck_machine.id,
            reason=reason,
            effective_capacity=round(bottleneck_machine.base_capacity_per_min * 60, 2),
            line_throughput=round(hourly_throughput, 2),
            upstream_queue_pressure=up_pressure,
            downstream_queue_pressure=down_pressure
        )

        downtime_impact = {m.id: m.time_down for m in self.machines if m.time_down > 0}

        return SimulationResult(
            throughput=round(hourly_throughput, 2),
            production=round(final_production, 2),
            bottleneck=bottleneck,
            machine_utilization=machine_utilization,
            buffer_utilization=buffer_utilization,
            downtime_impact=downtime_impact,
            propagation_events=self.propagation_events,
            queue_changes={b.id: round(b.max_observed, 2) for b in self.buffers},
            detected_inefficiencies=[f"Machine {bottleneck_machine.id} limits system throughput to {round(hourly_throughput, 2)} units/hr."],
            possible_interventions=[f"Increase capacity or reduce downtime of {bottleneck_machine.id}"],
            time_series=self.time_series
        )
