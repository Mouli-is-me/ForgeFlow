import React from "react";
import { useSimulationStore } from "../../store/useSimulationStore";
import { ArrowRight, AlertTriangle, Activity } from "lucide-react";
import {
  MachineSnapshot,
  QueueSnapshot,
  MachineState,
} from "../../engine/types";

export const ProductionLineVisualizer: React.FC = () => {
  const { config, state, selectedMachineId, selectMachine } =
    useSimulationStore();

  if (!state) return null;

  return (
    <div className="w-full flex items-center justify-start lg:justify-center gap-1 py-8 overflow-x-auto relative min-h-[300px] px-2">
      {/* Input */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-12 h-12 rounded-full bg-industrial-panel border border-industrial-border flex items-center justify-center mb-2 shadow-sm">
          <ArrowRight className="w-5 h-5 text-industrial-muted" />
        </div>
        <span className="text-xs font-medium text-industrial-muted tracking-wider uppercase">
          Input
        </span>
        <span className="text-[10px] text-industrial-muted mt-1">
          {config.arrivalRatePerHour}/hr
        </span>
      </div>

      <ArrowRight className="w-4 h-4 text-industrial-muted shrink-0" />

      {config.stages.map((stage, idx) => {
        const mState = state.machines[stage.id];
        const isBottleneck = state.bottleneck?.machineId === stage.id;
        const queueId = `q-${stage.id}-${config.stages[idx + 1]?.id}`;
        const queueState = state.queues[queueId];

        return (
          <React.Fragment key={stage.id}>
            <MachineNode
              snapshot={mState}
              isBottleneck={isBottleneck}
              isSelected={selectedMachineId === stage.id}
              onSelect={() =>
                selectMachine(selectedMachineId === stage.id ? null : stage.id)
              }
            />

            {idx < config.stages.length - 1 && (
              <>
                <ArrowRight className="w-3 h-3 text-industrial-muted shrink-0" />
                <QueueNode snapshot={queueState} />
                <ArrowRight className="w-3 h-3 text-industrial-muted shrink-0" />
              </>
            )}
          </React.Fragment>
        );
      })}

      <ArrowRight className="w-4 h-4 text-industrial-muted shrink-0" />

      {/* Output */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-12 h-12 rounded-full bg-green-900/20 border border-green-800 flex items-center justify-center mb-2 shadow-sm relative">
          <span className="text-xl font-mono text-green-500 font-bold">
            {state.totalCompleted}
          </span>
          {/* subtle animated ring for outputs? maybe not necessary */}
        </div>
        <span className="text-xs font-medium text-industrial-muted tracking-wider uppercase">
          Output
        </span>
      </div>
    </div>
  );
};

const MachineNode: React.FC<{
  snapshot: MachineSnapshot;
  isBottleneck: boolean;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ snapshot, isBottleneck, isSelected, onSelect }) => {
  if (!snapshot) return null;

  const stateColors: Record<MachineState, string> = {
    RUNNING: "border-blue-500 bg-blue-500/10",
    IDLE: "border-industrial-border bg-industrial-panel",
    STARVED: "border-amber-500/50 bg-amber-500/5",
    BLOCKED: "border-orange-500/50 bg-orange-500/10",
    DOWN: "border-red-500 bg-red-500/10",
  };

  const stateTextColors: Record<MachineState, string> = {
    RUNNING: "text-blue-500",
    IDLE: "text-industrial-muted",
    STARVED: "text-amber-500",
    BLOCKED: "text-orange-500",
    DOWN: "text-red-500",
  };

  const stateDescriptions: Record<MachineState, string> = {
    RUNNING: "Processing unit",
    IDLE: "Waiting for work",
    STARVED: "Waiting for material",
    BLOCKED: "Cannot release output",
    DOWN: "Machine unavailable",
  };

  return (
    <button
      type="button"
      aria-label={`Inspect ${snapshot.name}`}
      onClick={onSelect}
      className={`relative flex flex-col text-left w-32 shrink-0 rounded-lg border-2 ${stateColors[snapshot.state]} ${isBottleneck ? "ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : ""} ${isSelected ? "outline outline-2 outline-industrial-accent outline-offset-2" : "shadow-sm"} transition-colors duration-200 bg-industrial-bg overflow-hidden cursor-pointer hover:border-industrial-text/50`}
    >
      {/* Progress Bar (bg) */}
      {snapshot.state === "RUNNING" && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-200 ease-linear"
          style={{ width: `${snapshot.processingProgress * 100}%` }}
        />
      )}

      {/* Header */}
      <div className="p-3 border-b border-industrial-border bg-industrial-panel/50 flex flex-col gap-1">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-industrial-text text-base tracking-wide">
            {snapshot.name}
          </h3>
          {snapshot.state === "DOWN" && (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
          {snapshot.state === "RUNNING" && (
            <Activity className="w-4 h-4 text-blue-500" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div
            className={`w-2 h-2 rounded-full ${stateTextColors[snapshot.state].replace("text-", "bg-")}`}
          ></div>
          <span
            className={`text-xs font-bold tracking-wider uppercase ${stateTextColors[snapshot.state]}`}
          >
            {snapshot.state}
          </span>
        </div>
        <span className="text-[11px] text-industrial-muted">
          {stateDescriptions[snapshot.state]}
        </span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3 text-sm">
        <div className="flex justify-between items-end border-b border-industrial-border/50 pb-1">
          <span className="text-industrial-muted text-xs">Utilization</span>
          <span className="font-mono text-industrial-text">
            {(snapshot.utilization * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex justify-between items-end pb-1">
          <span className="text-industrial-muted text-xs">Completed</span>
          <span className="font-mono text-industrial-text">
            {snapshot.processedCount}
          </span>
        </div>
      </div>

      {isBottleneck && (
        <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-bl uppercase tracking-wider">
          Bottleneck
        </div>
      )}
    </button>
  );
};

const QueueNode: React.FC<{ snapshot?: QueueSnapshot }> = ({ snapshot }) => {
  if (!snapshot) return null;

  const fillRatio = snapshot.currentUnits / snapshot.maxCapacity;
  const isFull = fillRatio >= 1;
  const isEmpty = snapshot.currentUnits === 0;

  return (
    <div className="flex flex-col items-center w-14 shrink-0 relative">
      <div className="text-[10px] text-industrial-muted mb-1 flex justify-between w-full px-1">
        <span>Q</span>
        <span className="font-mono">
          {snapshot.currentUnits}/{snapshot.maxCapacity}
        </span>
      </div>

      <div
        className={`w-full h-8 border ${isFull ? "border-orange-500" : "border-industrial-border"} rounded flex overflow-hidden bg-industrial-panel relative`}
      >
        {/* Fill bar representing queue level */}
        <div
          className={`absolute bottom-0 left-0 h-full ${isFull ? "bg-orange-500/50" : "bg-industrial-muted/30"} transition-all duration-200`}
          style={{ width: `${fillRatio * 100}%` }}
        />
        {/* Draw little dots for units if not too many */}
        <div className="absolute inset-0 flex items-center gap-[1px] px-1 overflow-hidden">
          {Array.from({ length: Math.min(snapshot.currentUnits, 20) }).map(
            (_, i) => (
              <div
                key={i}
                className="w-1.5 h-4 bg-industrial-text/40 rounded-sm shrink-0"
              />
            ),
          )}
          {snapshot.currentUnits > 20 && (
            <span className="text-[10px] ml-1 font-mono text-industrial-text">
              +{snapshot.currentUnits - 20}
            </span>
          )}
        </div>
      </div>

      {isFull && (
        <span className="text-[9px] text-orange-500 font-bold uppercase mt-1 absolute -bottom-4">
          Full
        </span>
      )}
      {isEmpty && (
        <span className="text-[9px] text-industrial-muted font-bold uppercase mt-1 absolute -bottom-4">
          Empty
        </span>
      )}
    </div>
  );
};
