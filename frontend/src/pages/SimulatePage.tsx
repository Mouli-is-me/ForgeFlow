import React, { useEffect, useRef } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  HeartPulse,
  Search,
  Zap,
} from "lucide-react";
import {
  useSimulationStore,
  explainMachine,
  getProductionHealth,
} from "../store/useSimulationStore";
import { SimulationControls } from "../components/simulation/SimulationControls";
import { ProductionLineVisualizer } from "../components/simulation/ProductionLineVisualizer";
import { EventInjector } from "../components/simulation/EventInjector";
import { SimulationLog } from "../components/simulation/SimulationLog";

export const SimulatePage: React.FC = () => {
  const {
    state,
    isPlaying,
    speedMultiplier,
    tick,
    initSimulation,
    config,
    selectedMachineId,
    history,
    impactBaseline,
  } = useSimulationStore();
  const lastTickTime = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!state) initSimulation();
  }, [state, initSimulation]);
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(frameRef.current);
      return;
    }
    const loop = (time: number) => {
      if (!lastTickTime.current) lastTickTime.current = time;
      const elapsed = time - lastTickTime.current;
      const interval = 1000 / speedMultiplier;
      if (elapsed >= interval) {
        for (let i = 0; i < Math.floor(elapsed / interval); i += 1) tick();
        lastTickTime.current = time - (elapsed % interval);
      }
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frameRef.current);
      lastTickTime.current = 0;
    };
  }, [isPlaying, speedMultiplier, tick]);

  if (!state) return null;
  const health = getProductionHealth(state);
  const selectedMachine = selectedMachineId
    ? state.machines[selectedMachineId]
    : null;
  const selectedStage = config.stages.find(
    (stage) => stage.id === selectedMachineId,
  );
  const inputQueue = selectedMachineId
    ? Object.values(state.queues).find(
        (queue) => queue.targetId === selectedMachineId,
      )
    : null;
  const outputQueue = selectedMachineId
    ? Object.values(state.queues).find(
        (queue) => queue.sourceId === selectedMachineId,
      )
    : null;
  const totalCapacity = config.stages[config.stages.length - 1]?.capacity || 1;
  const efficiency = Math.min(
    100,
    Math.round((state.throughputPerHour / totalCapacity) * 100),
  );
  const healthClass =
    health.tone === "healthy"
      ? "text-green-500 border-green-500/30 bg-green-500/5"
      : health.tone === "pressure"
        ? "text-amber-500 border-amber-500/30 bg-amber-500/5"
        : "text-red-500 border-red-500/30 bg-red-500/5";

  return (
    <div className="flex-1 overflow-y-auto bg-industrial-bg">
      <div className="max-w-[1800px] w-full mx-auto p-4 md:p-7 flex flex-col gap-5">
        <header className="flex flex-col xl:flex-row justify-between gap-6 border-b border-industrial-border pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-industrial-accent font-semibold mb-2">
              Digital twin / review mode
            </p>
            <h2 className="text-2xl font-semibold text-industrial-text flex items-center gap-3">
              Demo Factory{" "}
              <span className="text-xs uppercase tracking-wider px-2 py-1 rounded border border-industrial-border text-industrial-muted">
                {isPlaying ? "Running" : "Paused"}
              </span>
            </h2>
            <p className="text-sm text-industrial-muted mt-1">
              Build → run → observe → disrupt → understand → experiment
            </p>
            <p className="text-[11px] text-industrial-muted mt-2 uppercase tracking-wider">
              Data source: simulated operational data · deterministic seed{" "}
              {config.randomSeed ?? 42}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 md:gap-8">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded border ${healthClass}`}
              title={health.explanation}
            >
              <HeartPulse className="w-4 h-4" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-semibold">
                  Production health
                </span>
                <span className="text-sm font-semibold">{health.label}</span>
              </div>
            </div>
            <Metric
              icon={<Activity />}
              label="Throughput"
              value={state.throughputPerHour.toFixed(0)}
              suffix="units/hr"
            />
            <Metric
              icon={<CheckCircle />}
              label="Units produced"
              value={String(state.totalCompleted)}
            />
            <Metric
              icon={<Clock />}
              label="Line efficiency"
              value={String(efficiency)}
              suffix="%"
            />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-industrial-muted flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Primary constraint
              </span>
              <span
                className={`text-lg font-semibold ${state.bottleneck ? "text-amber-500" : "text-green-500"}`}
              >
                {state.bottleneck?.machineId || "None"}
              </span>
            </div>
          </div>
        </header>

        <section className="min-h-[390px] flex items-center justify-center bg-industrial-panel/50 border border-industrial-border rounded-lg shadow-sm px-4 overflow-hidden">
          <ProductionLineVisualizer />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5">
          <div className="bg-industrial-panel border border-industrial-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-industrial-muted">
                  System explanation
                </p>
                <h3 className="text-lg font-semibold text-industrial-text">
                  Why is this happening?
                </h3>
              </div>
              <Zap className="w-5 h-5 text-industrial-accent" />
            </div>
            <p className="text-sm text-industrial-muted leading-6">
              {selectedMachine
                ? explainMachine(state, config, selectedMachine.id)
                : health.explanation}
            </p>
            {state.bottleneck && (
              <div className="mt-4 pt-4 border-t border-industrial-border">
                <p className="text-xs uppercase tracking-wider text-amber-500 font-semibold">
                  Primary constraint:{" "}
                  {config.stages.find(
                    (stage) => stage.id === state.bottleneck?.machineId,
                  )?.name || state.bottleneck.machineId}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-industrial-muted">
                  {state.bottleneck.reasons.map((reason) => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="bg-industrial-panel border border-industrial-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-industrial-accent" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-industrial-text">
                Machine inspection
              </h3>
            </div>
            {selectedMachine && selectedStage ? (
              <div className="space-y-3 text-sm">
                <InfoRow
                  label={`${selectedStage.name} status`}
                  value={selectedMachine.state}
                />
                <InfoRow
                  label="Utilization"
                  value={`${(selectedMachine.utilization * 100).toFixed(0)}%`}
                />
                <InfoRow
                  label="Processed"
                  value={`${selectedMachine.processedCount} units`}
                />
                <InfoRow
                  label="Queue before / after"
                  value={`${inputQueue?.currentUnits ?? 0} / ${outputQueue?.currentUnits ?? 0}`}
                />
                <details className="pt-2">
                  <summary className="cursor-pointer text-industrial-accent">
                    Simulation details
                  </summary>
                  <p className="mt-2 text-xs text-industrial-muted">
                    Running {selectedMachine.timeRunning}s · Down{" "}
                    {selectedMachine.timeDown}s · Blocked{" "}
                    {selectedMachine.timeBlocked}s · Starved{" "}
                    {selectedMachine.timeStarved}s
                  </p>
                </details>
              </div>
            ) : (
              <p className="text-sm text-industrial-muted">
                Select a machine in the production line to inspect its live
                condition.
              </p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div className="lg:col-span-2 flex flex-col gap-5">
            <SimulationControls />
            <EventInjector />
          </div>
          <SimulationLog />
          <div className="bg-industrial-panel border border-industrial-border rounded-lg p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-industrial-text mb-3">
              Review signal
            </h3>
            <p className="text-sm text-industrial-muted leading-6">
              {health.explanation}
            </p>
            <p className="mt-4 text-xs text-industrial-muted">
              {history.length} live observations captured.
            </p>
            {impactBaseline && (
              <p className="mt-2 text-xs text-industrial-muted">
                Event baseline captured at {formatTime(impactBaseline.timeSec)}.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const Metric: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
}> = ({ icon, label, value, suffix }) => (
  <div>
    <span className="text-[10px] uppercase tracking-wider text-industrial-muted flex items-center gap-1">
      {icon}
      {label}
    </span>
    <span className="text-2xl font-mono text-industrial-text">{value}</span>
    {suffix && (
      <span className="text-xs text-industrial-muted ml-1">{suffix}</span>
    )}
  </div>
);
const InfoRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="flex justify-between gap-4">
    <span className="text-industrial-muted">{label}</span>
    <strong className="text-industrial-text">{value}</strong>
  </div>
);
const formatTime = (seconds: number) =>
  new Date(seconds * 1000).toISOString().slice(11, 19);
