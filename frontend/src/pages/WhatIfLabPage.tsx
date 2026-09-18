import React, { useState } from "react";
import { ArrowRight, TrendingUp, AlertTriangle, Settings2 } from "lucide-react";
import { useSimulationStore } from "../store/useSimulationStore";
import { SimulationEngine } from "../engine/SimulationEngine";
import { SimulationConfig, SimulationState } from "../engine/types";
import { BottleneckAnalyzer } from "../engine/BottleneckAnalyzer";
type ScenarioParameter = "processingTimeSec" | "capacity" | "machineCount";
type ScenarioOperation = "multiply" | "set" | "add";
type ScenarioChange = {
  machineId: string;
  parameter: ScenarioParameter;
  operation: ScenarioOperation;
  value: number;
};

const RUN_SECONDS = 3600 * 8; // 8 hours

export const WhatIfLabPage: React.FC = () => {
  const { config } = useSimulationStore();

  // Manual Controls State
  const [selectedMachine, setSelectedMachine] = useState(
    config.stages[0]?.id || "",
  );
  const [selectedParam, setSelectedParam] =
    useState<ScenarioParameter>("processingTimeSec");
  const [selectedOp, setSelectedOp] = useState<ScenarioOperation>("multiply");
  const [val, setVal] = useState<number>(1.2);

  const [error, setError] = useState<string | null>(null);

  // Engine State
  const [isRunning, setIsRunning] = useState(false);
  const [baselineResult, setBaselineResult] = useState<SimulationState | null>(
    null,
  );
  const [scenarioResult, setScenarioResult] = useState<SimulationState | null>(
    null,
  );

  const runEngine = (simulationConfig: SimulationConfig) => {
    const engine = new SimulationEngine(simulationConfig);
    for (let second = 0; second < RUN_SECONDS; second += 1) engine.tick();
    const result = engine.getState();
    result.bottleneck = BottleneckAnalyzer.analyze(result);
    return result;
  };

  const applyScenarioChange = (
    baseConfig: SimulationConfig,
    change: ScenarioChange,
  ): SimulationConfig => {
    const nextConfig = JSON.parse(
      JSON.stringify(baseConfig),
    ) as SimulationConfig;
    const stage = nextConfig.stages.find(
      (item) => item.id === change.machineId,
    );
    if (!stage) throw new Error("Selected machine could not be found.");
    const currentValue = stage[change.parameter];
    const nextValue =
      change.operation === "multiply"
        ? currentValue * change.value
        : change.operation === "add"
          ? currentValue + change.value
          : change.value;
    if (nextValue <= 0 || !Number.isFinite(nextValue))
      throw new Error("Scenario values must be greater than zero.");
    stage[change.parameter] = Math.round(nextValue);
    return nextConfig;
  };

  const handleRunSimulation = () => {
    setIsRunning(true);
    setBaselineResult(null);
    setScenarioResult(null);

    // Give UI time to update
    setTimeout(() => {
      try {
        const change: ScenarioChange = {
          machineId: selectedMachine,
          parameter: selectedParam,
          operation: selectedOp,
          value: val,
        };

        const baselineConfig = JSON.parse(
          JSON.stringify(config),
        ) as SimulationConfig;
        const bResult = runEngine(baselineConfig);

        const scenarioConfig = applyScenarioChange(baselineConfig, change);
        const sResult = runEngine(scenarioConfig);

        setBaselineResult(bResult);
        setScenarioResult(sResult);
      } catch (err: any) {
        setError("Simulation failed: " + err.message);
      } finally {
        setIsRunning(false);
      }
    }, 50);
  };

  const changeStr = (baseline: number, scenario: number) =>
    `${scenario - baseline >= 0 ? "+" : ""}${(scenario - baseline).toFixed(1)}`;

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <p className="text-xs uppercase tracking-[0.22em] text-primary font-semibold mb-2 flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> What-If Lab
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            Scenario Comparison
          </h1>
          <p className="text-muted mt-2">
            Modify production parameters and run isolated, deterministic
            simulations to evaluate throughput and bottleneck shifts.
          </p>
        </header>

        {error && (
          <div className="bg-danger/10 border border-danger/30 p-4 rounded flex items-center gap-3 text-danger">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* MANUAL CONFIGURATION */}
        <section className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Settings2 className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Scenario Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                Machine
              </label>
              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                className="bg-background border border-border rounded px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                {config.stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                Parameter
              </label>
              <select
                value={selectedParam}
                onChange={(e) => setSelectedParam(e.target.value as any)}
                className="bg-background border border-border rounded px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="processingTimeSec">Processing Time (sec)</option>
                <option value="capacity">Capacity</option>
                <option value="machineCount">Machine Count</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                Adjustment
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedOp}
                  onChange={(e) => setSelectedOp(e.target.value as any)}
                  className="bg-background border border-border rounded px-3 py-2 text-sm text-foreground outline-none focus:border-primary w-1/2"
                >
                  <option value="multiply">Multiply by</option>
                  <option value="set">Set to</option>
                  <option value="add">Add</option>
                </select>
                <input
                  type="number"
                  step="0.1"
                  value={val}
                  onChange={(e) => setVal(parseFloat(e.target.value))}
                  className="bg-background border border-border rounded px-3 py-2 text-sm text-foreground outline-none focus:border-primary w-1/2"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isRunning}
              className="flex items-center justify-center gap-2 px-6 py-2 h-[38px] bg-primary hover:bg-primary/90 text-primary-foreground rounded font-semibold disabled:opacity-50 transition-colors"
            >
              {isRunning ? "Simulating..." : "Run Simulation"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* RESULTS */}
        {baselineResult && scenarioResult && (
          <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-success" />
              <h2 className="text-xl font-semibold text-foreground">
                Simulation Result ({RUN_SECONDS / 3600}h run)
              </h2>
            </div>

            <div className="overflow-x-auto bg-surface border border-border rounded-lg shadow-sm">
              <table className="w-full text-left">
                <thead className="text-xs uppercase tracking-wider text-muted border-b border-border bg-background/50">
                  <tr>
                    <th className="px-5 py-4">Measured metric</th>
                    <th className="px-5 py-4">Baseline</th>
                    <th className="px-5 py-4">Scenario</th>
                    <th className="px-5 py-4">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  <CompareRow
                    label="Throughput"
                    baseline={`${baselineResult.throughputPerHour.toFixed(1)} /hr`}
                    scenario={`${scenarioResult.throughputPerHour.toFixed(1)} /hr`}
                    change={changeStr(
                      baselineResult.throughputPerHour,
                      scenarioResult.throughputPerHour,
                    )}
                  />
                  <CompareRow
                    label="Units completed"
                    baseline={`${baselineResult.totalCompleted}`}
                    scenario={`${scenarioResult.totalCompleted}`}
                    change={changeStr(
                      baselineResult.totalCompleted,
                      scenarioResult.totalCompleted,
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

            <div className="bg-surface border-l-4 border-primary p-5 rounded shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                Measured result
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                The comparison above is calculated from two independent
                deterministic simulation runs using the same baseline
                configuration and seed.
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
    <td className="px-5 py-4 font-medium text-foreground">{label}</td>
    <td className="px-5 py-4 font-mono text-muted">{baseline}</td>
    <td className="px-5 py-4 font-mono text-foreground">{scenario}</td>
    <td className="px-5 py-4 font-mono text-primary font-bold">{change}</td>
  </tr>
);
