import React, { useState } from "react";
import { useSimulationStore } from "../../store/useSimulationStore";
import { InjectedEvent, SimulationEventType } from "../../engine/types";

export const EventInjector: React.FC = () => {
  const { config, state, impactBaseline, impactStageId, injectEvent } =
    useSimulationStore();
  const [targetStage, setTargetStage] = useState<string>(
    config.stages.find((stage) => stage.name === "Inspection")?.id ||
      config.stages[0]?.id ||
      "",
  );
  const [eventType, setEventType] = useState<SimulationEventType>("BREAKDOWN");
  const [duration, setDuration] = useState<number>(120);

  const handleInject = () => {
    const event: InjectedEvent = {
      targetStage,
      type: eventType,
      durationSec: eventType === "BREAKDOWN" ? duration : undefined,
      value: eventType === "SLOWDOWN" ? 2.0 : undefined, // example
    };
    injectEvent(event);
  };

  return (
    <div className="bg-industrial-panel border border-industrial-border rounded shadow-sm p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium text-industrial-text uppercase tracking-wider">
          Disrupt the factory
        </h3>
        <p className="text-xs text-industrial-muted mt-1">
          Run a controlled manufacturing experiment.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-industrial-muted">Target Stage</label>
          <select
            value={targetStage}
            onChange={(e) => setTargetStage(e.target.value)}
            className="bg-industrial-bg border border-industrial-border text-industrial-text text-sm rounded px-3 py-2 outline-none focus:border-industrial-accent"
          >
            {config.stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-industrial-muted">Event Type</label>
          <select
            value={eventType}
            onChange={(e) =>
              setEventType(e.target.value as SimulationEventType)
            }
            className="bg-industrial-bg border border-industrial-border text-industrial-text text-sm rounded px-3 py-2 outline-none focus:border-industrial-accent"
          >
            <option value="BREAKDOWN">Machine Breakdown</option>
            <option value="SLOWDOWN">Machine Slowdown</option>
            <option value="RECOVERY">Force Recovery</option>
          </select>
        </div>

        {eventType === "BREAKDOWN" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-industrial-muted">
              Duration (sec)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="bg-industrial-bg border border-industrial-border text-industrial-text text-sm rounded px-3 py-2 outline-none focus:border-industrial-accent w-24"
            />
          </div>
        )}

        <button
          onClick={handleInject}
          className="px-4 py-2 bg-red-900/40 hover:bg-red-800/60 text-red-400 border border-red-800/50 rounded font-medium text-sm transition-colors"
        >
          Inject Failure
        </button>
      </div>
      {impactBaseline && state && impactStageId && (
        <div className="border-t border-industrial-border pt-3 text-xs text-red-400">
          <strong>Event impact</strong>
          <p className="mt-1 text-industrial-muted">
            {config.stages.find((stage) => stage.id === impactStageId)?.name ||
              "The selected stage"}{" "}
            downtime is measured from the injection baseline.
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-industrial-muted">
            <span>Throughput change</span>
            <strong className="text-industrial-text">
              {impactBaseline.throughputPerHour.toFixed(1)} →{" "}
              {state.throughputPerHour.toFixed(1)} /hr
            </strong>
            <span>Units completed</span>
            <strong className="text-industrial-text">
              {impactBaseline.totalCompleted} → {state.totalCompleted}
            </strong>
            <span>Machine downtime</span>
            <strong className="text-industrial-text">
              {Math.max(
                0,
                (state.machines[impactStageId]?.timeDown || 0) -
                  (impactBaseline.machines[impactStageId]?.timeDown || 0),
              )}{" "}
              sec
            </strong>
            <span>Current condition</span>
            <strong className="text-industrial-text">
              {state.machines[impactStageId]?.state || "Unknown"}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};
