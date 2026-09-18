import { expect, test, describe } from "vitest";
import { SimulationEngine } from "./SimulationEngine";
import { SimulationConfig } from "./types";

describe("Deterministic Simulation Engine", () => {
  const baseConfig: SimulationConfig = {
    randomSeed: 42, // Fixed seed
    arrivalRatePerHour: 100,
    stages: [
      {
        id: "s1",
        name: "S1",
        processingTimeSec: 10,
        capacity: 100,
        availability: 100,
        failureProbability: 0,
        meanRecoveryTimeSec: 0,
        machineCount: 1,
        queueCapacity: 100,
      },
      {
        id: "s2",
        name: "S2",
        processingTimeSec: 15,
        capacity: 100,
        availability: 100,
        failureProbability: 0,
        meanRecoveryTimeSec: 0,
        machineCount: 1,
        queueCapacity: 10,
      },
    ],
  };

  test("Same seed produces identical results", () => {
    const engine1 = new SimulationEngine(baseConfig);
    const engine2 = new SimulationEngine(baseConfig);

    for (let i = 0; i < 3600; i++) {
      engine1.tick();
      engine2.tick();
    }

    const state1 = engine1.getState();
    const state2 = engine2.getState();

    expect(state1.totalCompleted).toBe(state2.totalCompleted);
    expect(state1.machines["s1"].processedCount).toBe(
      state2.machines["s1"].processedCount,
    );
  });

  test("Different seed produces different breakdown events (if non-zero failure)", () => {
    const failConfig = JSON.parse(
      JSON.stringify(baseConfig),
    ) as SimulationConfig;
    failConfig.stages[0].failureProbability = 0.5;
    failConfig.stages[0].meanRecoveryTimeSec = 60;

    failConfig.randomSeed = 42;
    const engineA = new SimulationEngine(failConfig);

    failConfig.randomSeed = 999;
    const engineB = new SimulationEngine(failConfig);

    for (let i = 0; i < 3600; i++) {
      engineA.tick();
      engineB.tick();
    }

    const stateA = engineA.getState();
    const stateB = engineB.getState();

    expect(stateA.totalCompleted).not.toBe(stateB.totalCompleted);
  });
});
