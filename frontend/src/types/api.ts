export interface MachineConfig {
  id: string;
  name: string;
  capacity_per_hour: number;
}

export interface SimulationEvent {
  tick: number;
  type: string;
  machine_id: string;
  duration?: number;
  value?: number;
}

export interface LineConfig {
  machines: MachineConfig[];
  buffer_capacity: number;
  warmup_minutes: number;
}

export interface BottleneckAnalysis {
  machine: string;
  reason: string;
  effective_capacity: number;
  line_throughput: number;
  upstream_queue_pressure: number;
  downstream_queue_pressure: number;
}

export interface MachineUtilization {
  capacity_utilization: number;
  time_utilization: number;
}

export interface SimulationResult {
  throughput: number;
  production: number;
  bottleneck: BottleneckAnalysis;
  machine_utilization: Record<string, MachineUtilization>;
  buffer_utilization: Record<string, number>;
  downtime_impact: Record<string, number>;
  propagation_events: any[];
  queue_changes: Record<string, number>;
  detected_inefficiencies: string[];
  possible_interventions: string[];
  time_series: TimeSeriesData[];
}

export interface TimeSeriesData {
  tick: number;
  throughput_so_far: number;
  buffers: Record<string, number>;
  machine_status: Record<string, string>;
}
