import React, { useState } from "react";
import { ArrowRight, FlaskConical, TrendingUp } from "lucide-react";
import { useSimulationStore } from "../store/useSimulationStore";
import { SimulationEngine } from "../engine/SimulationEngine";
import { SimulationConfig, SimulationState } from "../engine/types";
import { BottleneckAnalyzer } from "../engine/BottleneckAnalyzer";

const RUN_SECONDS = 3600 * 8;

type Modification =
  | "CAPACITY_INCREASE"
  | "CAPACITY_DECREASE"
  | "ADD_MACHINE"
  | "FIX_RELIABILITY";

export const WhatIfLabPage: React.FC = () => {
  const { config } = useSimulationStore();
  const defaultStage =
    config.stages.find((stage) => stage.name === "Inspection")?.id ||
    config.stages[0]?.id ||
    "";
  const [selectedStageId, setSelectedStageId] = useState(defaultStage);
  const [modificationType, setModificationType] =
    useState<Modification>("CAPACITY_INCREASE");
  const [baselineResult, setBaselineResult] = useState<SimulationState | null>(
    null,
  );
  const [scenarioResult, setScenarioResult] = useState<SimulationState | null>(
    null,
  );
  const [isRunning, setIsRunning] = useState(false);

  const runEngine = (simulationConfig: SimulationConfig) => {
    const engine = new SimulationEngine(simulationConfig);
    for (let second = 0; second < RUN_SECONDS; second += 1) engine.tick();
    const result = engine.getState();
    result.bottleneck = BottleneckAnalyzer.analyze(result);
    return result;
  };

  const runScenario = () => {
    setIsRunning(true);
    window.setTimeout(() => {
      const baselineConfig = JSON.parse(
        JSON.stringify(config),
      ) as SimulationConfig;
      const scenarioConfig = JSON.parse(
        JSON.stringify(config),
      ) as SimulationConfig;
      const target = scenarioConfig.stages.find(
        (stage) => stage.id === selectedStageId,
      );
      if (target) {
        if (modificationType === "CAPACITY_INCREASE") {
          target.capacity = Math.round(target.capacity * 1.5);
          target.processingTimeSec = Math.max(
            1,
            Math.round(target.processingTimeSec * 0.8),
          );
        } else if (modificationType === "CAPACITY_DECREASE") {
          target.capacity = Math.max(1, Math.round(target.capacity * 0.7));
          target.processingTimeSec = Math.round(
            target.processingTimeSec * 1.25,
          );
        } else if (modificationType === "ADD_MACHINE") {
          target.machineCount += 1;
        } else {
          target.failureProbability = 0;
        }
      }
      setBaselineResult(runEngine(baselineConfig));
      setScenarioResult(runEngine(scenarioConfig));
      setIsRunning(false);
    }, 20);
  };

  const stageName =
    config.stages.find((stage) => stage.id === selectedStageId)?.name ||
    "selected stage";
  const metric = (result: SimulationState, kind: "queue" | "downtime") =>
    kind === "queue"
      ? Object.values(result.queues).reduce(
          (sum, queue) => sum + queue.averageObserved,
          0,
        ) / Math.max(1, Object.keys(result.queues).length)
      : Object.values(result.machines).reduce(
          (sum, machine) => sum + machine.timeDown,
          0,
        );
  const change = (baseline: number, scenario: number) =>
    `${scenario - baseline >= 0 ? "+" : ""}${(scenario - baseline).toFixed(1)}`;

  return (
    <div className="flex-1 overflow-y-auto bg-industrial-bg p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <p className="text-xs uppercase tracking-[0.22em] text-industrial-accent font-semibold mb-2">
            Experiment / independent run
          </p>
          <h1 className="text-3xl font-semibold text-industrial-text">
            What happens if...?
          </h1>
          <p className="text-industrial-muted mt-2">
            Run the same deterministic factory twice, changing one operational
            decision.
          </p>
        </header>
        <section className="bg-industrial-panel border border-industrial-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-5">
            <FlaskConical className="w-5 h-5 text-industrial-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-industrial-text">
              Choose an experiment
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-5 items-end">
            <label className="flex flex-col gap-2 text-sm text-industrial-muted">
              What happens if...?
              <select
                value={modificationType}
                onChange={(event) =>
                  setModificationType(event.target.value as Modification)
                }
                className="bg-industrial-bg border border-industrial-border text-industrial-text rounded px-3 py-3"
              >
                <option value="CAPACITY_INCREASE">Increase capacity</option>
                <option value="CAPACITY_DECREASE">Reduce capacity</option>
                <option value="ADD_MACHINE">Add another machine</option>
                <option value="FIX_RELIABILITY">Reduce downtime</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-industrial-muted">
              At which stage?
              <select
                value={selectedStageId}
                onChange={(event) => setSelectedStageId(event.target.value)}
                className="bg-industrial-bg border border-industrial-border text-industrial-text rounded px-3 py-3"
              >
                {config.stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={runScenario}
              disabled={isRunning}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-industrial-accent hover:bg-blue-500 text-white rounded font-semibold disabled:opacity-50"
            >
              {isRunning ? "Running..." : "Run comparison"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-industrial-muted mt-4">
            Both runs use the same seed, configuration, and {RUN_SECONDS / 3600}
            -hour simulated duration. Only the selected change differs.
          </p>
        </section>
        {baselineResult && scenarioResult && (
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h2 className="text-xl font-semibold text-industrial-text">
                Baseline vs scenario
              </h2>
            </div>
            <div className="overflow-x-auto bg-industrial-panel border border-industrial-border rounded-lg">
              <table className="w-full text-left">
                <thead className="text-xs uppercase tracking-wider text-industrial-muted border-b border-industrial-border">
                  <tr>
                    <th className="px-5 py-4">Measured metric</th>
                    <th className="px-5 py-4">Baseline</th>
                    <th className="px-5 py-4">Scenario</th>
                    <th className="px-5 py-4">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-industrial-border text-sm">
                  <CompareRow
                    label="Throughput"
                    baseline={`${baselineResult.throughputPerHour.toFixed(1)} units/hr`}
                    scenario={`${scenarioResult.throughputPerHour.toFixed(1)} units/hr`}
                    change={change(
                      baselineResult.throughputPerHour,
                      scenarioResult.throughputPerHour,
                    )}
                  />
                  <CompareRow
                    label="Units completed"
                    baseline={`${baselineResult.totalCompleted}`}
                    scenario={`${scenarioResult.totalCompleted}`}
                    change={change(
                      baselineResult.totalCompleted,
                      scenarioResult.totalCompleted,
                    )}
                  />
                  <CompareRow
                    label="Average queue"
                    baseline={`${metric(baselineResult, "queue").toFixed(1)} units`}
                    scenario={`${metric(scenarioResult, "queue").toFixed(1)} units`}
                    change={change(
                      metric(baselineResult, "queue"),
                      metric(scenarioResult, "queue"),
                    )}
                  />
                  <CompareRow
                    label="Total downtime"
                    baseline={`${metric(baselineResult, "downtime").toFixed(0)} sec`}
                    scenario={`${metric(scenarioResult, "downtime").toFixed(0)} sec`}
                    change={change(
                      metric(baselineResult, "downtime"),
                      metric(scenarioResult, "downtime"),
                    )}
                  />
                  <CompareRow
                    label={`${stageName} utilization`}
                    baseline={`${(baselineResult.machines[selectedStageId]?.utilization * 100 || 0).toFixed(1)}%`}
                    scenario={`${(scenarioResult.machines[selectedStageId]?.utilization * 100 || 0).toFixed(1)}%`}
                    change={change(
                      (baselineResult.machines[selectedStageId]?.utilization ||
                        0) * 100,
                      (scenarioResult.machines[selectedStageId]?.utilization ||
                        0) * 100,
                    )}
                  />
                  <CompareRow
                    label="Primary constraint"
                    baseline={baselineResult.bottleneck?.machineId || "None"}
                    scenario={scenarioResult.bottleneck?.machineId || "None"}
                    change={
                      baselineResult.bottleneck?.machineId ===
                      scenarioResult.bottleneck?.machineId
                        ? "Unchanged"
                        : "Shifted"
                    }
                  />
                </tbody>
              </table>
            </div>
            <div className="bg-industrial-panel border-l-4 border-industrial-accent p-5 rounded">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-industrial-text mb-2">
                What changed?
              </h3>
              <p className="text-sm text-industrial-muted">
                The{" "}
                {modificationType === "CAPACITY_INCREASE"
                  ? "capacity increase"
                  : modificationType === "ADD_MACHINE"
                    ? "additional machine"
                    : modificationType === "FIX_RELIABILITY"
                      ? "reliability improvement"
                      : "capacity reduction"}{" "}
                at {stageName} produced the measured comparison above during the
                independent simulation.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const CompareRow: React.FC<{
  label: string;
  baseline: string;
  scenario: string;
  change: string;
}> = ({ label, baseline, scenario, change }) => (
  <tr>
    <td className="px-5 py-4 font-medium text-industrial-text">{label}</td>
    <td className="px-5 py-4 font-mono text-industrial-muted">{baseline}</td>
    <td className="px-5 py-4 font-mono text-industrial-text">{scenario}</td>
    <td className="px-5 py-4 font-mono text-industrial-accent">{change}</td>
  </tr>
);
