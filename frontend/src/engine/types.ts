export type MachineState = "RUNNING" | "IDLE" | "STARVED" | "BLOCKED" | "DOWN";

export interface StageConfig {
  id: string;
  name: string;
  processingTimeSec: number; // base time to process one unit
  capacity: number; // max units per hour
  machineCount: number;
  availability: number; // percentage (0-100)
  failureProbability: number; // percentage per unit processed
  meanRecoveryTimeSec: number;
  queueCapacity: number;
}

export interface SimulationConfig {
  arrivalRatePerHour: number;
  stages: StageConfig[];
  randomSeed?: number;
}

export interface MachineSnapshot {
  id: string;
  name: string;
  state: MachineState;
  processingProgress: number; // 0 to 1
  utilization: number; // 0 to 1
  timeRunning: number;
  timeDown: number;
  timeIdle: number;
  timeStarved: number;
  timeBlocked: number;
  processedCount: number;
  currentDowntimeLeft: number;
}

export interface QueueSnapshot {
  id: string;
  sourceId: string; // The stage feeding this queue (or 'INPUT')
  targetId: string; // The stage consuming from this queue
  currentUnits: number;
  maxCapacity: number;
  maxObserved: number;
  averageObserved: number;
}

export interface BottleneckInfo {
  machineId: string;
  confidence: "High" | "Medium" | "Low";
  reasons: string[];
}

export interface SimulationState {
  timeSec: number;
  totalCompleted: number;
  throughputPerHour: number;
  machines: Record<string, MachineSnapshot>;
  queues: Record<string, QueueSnapshot>;
  bottleneck: BottleneckInfo | null;
  eventsLog: string[];
}

export type SimulationEventType = "BREAKDOWN" | "SLOWDOWN" | "CAPACITY_CHANGE" | "PROCESSING_TIME_CHANGE" | "RECOVERY";

export interface InjectedEvent {
  targetStage: string;
  type: SimulationEventType;
  durationSec?: number;
  value?: number; // e.g. new capacity or slowdown multiplier
}
