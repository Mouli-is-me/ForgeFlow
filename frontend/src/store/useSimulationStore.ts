import { create } from "zustand";
import { SimulationEngine } from "../engine/SimulationEngine";
import {
  SimulationConfig,
  SimulationState,
  InjectedEvent,
} from "../engine/types";
import { BottleneckAnalyzer } from "../engine/BottleneckAnalyzer";

export const DEMO_CONFIG: SimulationConfig = {
  arrivalRatePerHour: 180,
  randomSeed: 101,
  stages: [
    {
      id: "s1",
      name: "Cutting",
      processingTimeSec: 20,
      capacity: 180,
      machineCount: 1,
      availability: 100,
      failureProbability: 0,
      meanRecoveryTimeSec: 0,
      queueCapacity: 50,
    },
    {
      id: "s2",
      name: "Assembly",
      processingTimeSec: 30,
      capacity: 120,
      machineCount: 1,
      availability: 100,
      failureProbability: 0,
      meanRecoveryTimeSec: 60,
      queueCapacity: 20,
    },
    {
      id: "s3",
      name: "Inspection",
      processingTimeSec: 15,
      capacity: 240,
      machineCount: 1,
      availability: 100,
      failureProbability: 0,
      meanRecoveryTimeSec: 120,
      queueCapacity: 10,
    },
    {
      id: "s4",
      name: "Packaging",
      processingTimeSec: 25,
      capacity: 144,
      machineCount: 1,
      availability: 100,
      failureProbability: 0,
      meanRecoveryTimeSec: 0,
      queueCapacity: 30,
    },
  ],
};

interface SimulationStore {
  config: SimulationConfig;
  engine: SimulationEngine | null;
  state: SimulationState | null;
  isPlaying: boolean;
  speedMultiplier: number;
  history: SimulationState[];
  selectedMachineId: string | null;
  impactBaseline: SimulationState | null;
  impactStageId: string | null;

  // Actions
  loadConfig: (config: SimulationConfig) => void;
  resetDemo: () => void;
  initSimulation: () => void;
  play: () => void;
  pause: () => void;
  step: () => void;
  setSpeed: (speed: number) => void;
  injectEvent: (event: InjectedEvent) => void;
  tick: () => void;
  selectMachine: (machineId: string | null) => void;
}

export const getProductionHealth = (
  state: SimulationState | null,
): {
  label: string;
  tone: "healthy" | "pressure" | "disrupted";
  explanation: string;
} => {
  if (!state)
    return {
      label: "Ready",
      tone: "healthy",
      explanation: "Load the demo factory to begin.",
    };
  const machines = Object.values(state.machines);
  const hasDown = machines.some((machine) => machine.state === "DOWN");
  const hasPressure =
    machines.some(
      (machine) => machine.state === "BLOCKED" || machine.state === "STARVED",
    ) ||
    Object.values(state.queues).some(
      (queue) => queue.currentUnits / queue.maxCapacity > 0.75,
    );
  if (hasDown)
    return {
      label: "Disrupted",
      tone: "disrupted",
      explanation: "A machine is down, so material flow is being interrupted.",
    };
  if (hasPressure)
    return {
      label: "Under pressure",
      tone: "pressure",
      explanation: "Queue pressure or starvation is changing the line flow.",
    };
  return {
    label: "Healthy",
    tone: "healthy",
    explanation:
      "Material is moving through the line without a visible constraint.",
  };
};

export const explainMachine = (
  state: SimulationState,
  config: SimulationConfig,
  machineId: string,
): string => {
  const machine = state.machines[machineId];
  if (!machine) return "Select a machine to inspect its current condition.";
  const index = config.stages.findIndex((stage) => stage.id === machineId);
  const before =
    index >= 0
      ? Object.values(state.queues).find(
          (queue) => queue.targetId === machineId,
        )
      : undefined;
  const after =
    index >= 0
      ? Object.values(state.queues).find(
          (queue) => queue.sourceId === machineId,
        )
      : undefined;
  if (machine.state === "DOWN")
    return `${machine.name} is unavailable for ${machine.currentDowntimeLeft} more seconds, interrupting flow through the line.`;
  if (machine.state === "BLOCKED")
    return `${machine.name} finished a unit but cannot release it because the downstream buffer is full.`;
  if (machine.state === "STARVED")
    return `${machine.name} is STARVED because its incoming queue is empty or upstream supply is constrained.`;
  if (before && before.currentUnits / before.maxCapacity > 0.7)
    return `${machine.name} is receiving work faster than it can currently process, so its upstream queue is building.`;
  if (after && after.currentUnits === 0 && index < config.stages.length - 1)
    return `${machine.name} is limiting downstream supply; the next stage has no waiting units.`;
  return `${machine.name} is processing at ${(machine.utilization * 100).toFixed(0)}% utilization with ${machine.processedCount} units completed.`;
};

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  config: DEMO_CONFIG,
  engine: null,
  state: null,
  isPlaying: false,
  speedMultiplier: 1,
  history: [],
  selectedMachineId: null,
  impactBaseline: null,
  impactStageId: null,

  loadConfig: (config: SimulationConfig) => {
    set({
      config,
      isPlaying: false,
      selectedMachineId: null,
      impactBaseline: null,
      impactStageId: null,
    });
    get().initSimulation();
  },

  resetDemo: () => {
    set({
      config: DEMO_CONFIG,
      isPlaying: false,
      selectedMachineId: null,
      impactBaseline: null,
      impactStageId: null,
    });
    get().initSimulation();
  },

  initSimulation: () => {
    const config = get().config;
    const newEngine = new SimulationEngine(config);
    set({
      engine: newEngine,
      state: newEngine.getState(),
      isPlaying: false,
      history: [],
      impactBaseline: null,
      impactStageId: null,
    });
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  step: () => {
    get().tick();
  },

  setSpeed: (speed: number) => set({ speedMultiplier: speed }),

  injectEvent: (event: InjectedEvent) => {
    const { engine } = get();
    if (engine) {
      engine.injectEvent(event);
      // Immediately reflect state change if needed
      const nextState = engine.getState();
      set({
        state: nextState,
        impactBaseline: get().state,
        impactStageId: event.targetStage,
      });
    }
  },

  tick: () => {
    const { engine } = get();
    if (engine) {
      engine.tick();
      const newState = engine.getState();
      newState.bottleneck = BottleneckAnalyzer.analyze(newState);
      set((state) => ({
        state: newState,
        history: [...state.history.slice(-119), newState],
      }));
    }
  },

  selectMachine: (machineId: string | null) =>
    set({ selectedMachineId: machineId }),
}));
