import React, { useState } from "react";
import { ArrowRight, Factory, Play, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DEMO_CONFIG, useSimulationStore } from "../store/useSimulationStore";
import { SimulationConfig, StageConfig } from "../engine/types";

const clone = (config: SimulationConfig) =>
  JSON.parse(JSON.stringify(config)) as SimulationConfig;

export const FactoryBuilderPage: React.FC = () => {
  const { loadConfig } = useSimulationStore();
  const navigate = useNavigate();
  const [config, setConfig] = useState<SimulationConfig>(clone(DEMO_CONFIG));
  const [showAdvanced, setShowAdvanced] = useState(false);

  const templates: {
    name: string;
    description: string;
    make: () => SimulationConfig;
  }[] = [
    {
      name: "Balanced line",
      description: "A calm four-stage line for learning the normal flow.",
      make: () => clone(DEMO_CONFIG),
    },
    {
      name: "High demand",
      description: "More incoming work to make queue pressure visible.",
      make: () => ({ ...clone(DEMO_CONFIG), arrivalRatePerHour: 260 }),
    },
    {
      name: "Bottleneck demo",
      description: "Assembly is deliberately slower than its neighbors.",
      make: () => {
        const next = clone(DEMO_CONFIG);
        next.stages[1].processingTimeSec = 45;
        next.stages[1].capacity = 80;
        return next;
      },
    },
    {
      name: "Failure propagation",
      description:
        "A central failure configuration for disruption experiments.",
      make: () => {
        const next = clone(DEMO_CONFIG);
        next.stages[2].failureProbability = 100;
        next.stages[2].meanRecoveryTimeSec = 120;
        return next;
      },
    },
  ];

  const updateStage = (id: string, update: Partial<StageConfig>) =>
    setConfig((current) => ({
      ...current,
      stages: current.stages.map((stage) =>
        stage.id === id ? { ...stage, ...update } : stage,
      ),
    }));
  const addStage = () =>
    setConfig((current) => ({
      ...current,
      stages: [
        ...current.stages,
        {
          id: `stage-${Date.now()}`,
          name: "New stage",
          processingTimeSec: 20,
          capacity: 180,
          machineCount: 1,
          availability: 100,
          failureProbability: 0,
          meanRecoveryTimeSec: 60,
          queueCapacity: 20,
        },
      ],
    }));
  const removeStage = (id: string) =>
    setConfig((current) =>
      current.stages.length > 1
        ? {
            ...current,
            stages: current.stages.filter((stage) => stage.id !== id),
          }
        : current,
    );
  const launch = () => {
    loadConfig(config);
    navigate("/simulate");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-industrial-bg p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <p className="text-xs uppercase tracking-[0.22em] text-industrial-accent font-semibold mb-2">
            Build / configure
          </p>
          <h1 className="text-3xl font-semibold text-industrial-text">
            Build your factory
          </h1>
          <p className="text-industrial-muted mt-2">
            Start with a deterministic template, then tune the line before
            running it.
          </p>
        </header>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-industrial-text mb-4">
            Start with a template
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <button
                type="button"
                key={template.name}
                onClick={() => {
                  const selectedConfig = template.make();
                  setConfig(selectedConfig);
                  loadConfig(selectedConfig);
                  navigate("/simulate");
                }}
                className="text-left bg-industrial-panel border border-industrial-border hover:border-industrial-accent rounded-lg p-5"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-industrial-text">
                      {template.name}
                    </h3>
                    <p className="text-sm text-industrial-muted mt-2">
                      {template.description}
                    </p>
                  </div>
                  <Play className="w-4 h-4 text-industrial-accent shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="bg-industrial-panel border border-industrial-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-industrial-text">
                Live line
              </h2>
              <p className="text-xs text-industrial-muted mt-1">
                {config.arrivalRatePerHour} units/hr input
              </p>
            </div>
            <button
              type="button"
              onClick={addStage}
              className="flex items-center gap-2 text-sm text-industrial-accent"
            >
              <Plus className="w-4 h-4" /> Add machine
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-3">
            <span className="text-xs uppercase text-industrial-muted shrink-0">
              Raw
            </span>
            {config.stages.map((stage) => (
              <React.Fragment key={stage.id}>
                <ArrowRight className="w-4 h-4 text-industrial-muted shrink-0" />
                <span className="px-3 py-2 border border-industrial-border rounded text-sm text-industrial-text whitespace-nowrap">
                  {stage.name}
                </span>
              </React.Fragment>
            ))}
            <ArrowRight className="w-4 h-4 text-industrial-muted shrink-0" />
            <span className="text-xs uppercase text-industrial-muted shrink-0">
              Output
            </span>
          </div>
        </section>
        <section className="space-y-3">
          {config.stages.map((stage) => (
            <StageEditor
              key={stage.id}
              stage={stage}
              onChange={updateStage}
              onRemove={removeStage}
              showAdvanced={showAdvanced}
            />
          ))}
        </section>
        <section className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            className="text-sm text-industrial-accent"
          >
            {showAdvanced ? "Hide advanced settings" : "Show advanced settings"}
          </button>
          <button
            type="button"
            onClick={launch}
            className="flex items-center gap-2 px-5 py-3 bg-industrial-accent hover:bg-blue-500 text-white rounded font-semibold"
          >
            <Factory className="w-4 h-4" /> Run this factory
          </button>
        </section>
      </div>
    </div>
  );
};

const StageEditor: React.FC<{
  stage: StageConfig;
  onChange: (id: string, update: Partial<StageConfig>) => void;
  onRemove: (id: string) => void;
  showAdvanced: boolean;
}> = ({ stage, onChange, onRemove, showAdvanced }) => (
  <div className="bg-industrial-panel border border-industrial-border rounded-lg p-4">
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-xs text-industrial-muted flex-1 min-w-40">
        Machine name
        <input
          value={stage.name}
          onChange={(event) => onChange(stage.id, { name: event.target.value })}
          className="bg-industrial-bg border border-industrial-border text-industrial-text rounded px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-industrial-muted">
        Processing time (sec)
        <input
          type="number"
          min="1"
          value={stage.processingTimeSec}
          onChange={(event) =>
            onChange(stage.id, {
              processingTimeSec: Math.max(1, Number(event.target.value)),
            })
          }
          className="bg-industrial-bg border border-industrial-border text-industrial-text rounded px-3 py-2 text-sm w-32"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-industrial-muted">
        Capacity (units/hr)
        <input
          type="number"
          min="1"
          value={stage.capacity}
          onChange={(event) =>
            onChange(stage.id, {
              capacity: Math.max(1, Number(event.target.value)),
            })
          }
          className="bg-industrial-bg border border-industrial-border text-industrial-text rounded px-3 py-2 text-sm w-32"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-industrial-muted">
        Buffer size
        <input
          type="number"
          min="1"
          value={stage.queueCapacity}
          onChange={(event) =>
            onChange(stage.id, {
              queueCapacity: Math.max(1, Number(event.target.value)),
            })
          }
          className="bg-industrial-bg border border-industrial-border text-industrial-text rounded px-3 py-2 text-sm w-28"
        />
      </label>
      <button
        type="button"
        aria-label={`Remove ${stage.name}`}
        onClick={() => onRemove(stage.id)}
        className="p-2 text-industrial-muted hover:text-red-400"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
    {showAdvanced && (
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-industrial-border">
        <label className="text-xs text-industrial-muted">
          Failure probability (%)
          <input
            type="number"
            min="0"
            max="100"
            value={stage.failureProbability}
            onChange={(event) =>
              onChange(stage.id, {
                failureProbability: Math.max(
                  0,
                  Math.min(100, Number(event.target.value)),
                ),
              })
            }
            className="block mt-1 bg-industrial-bg border border-industrial-border text-industrial-text rounded px-3 py-2 w-32"
          />
        </label>
        <label className="text-xs text-industrial-muted">
          Recovery time (sec)
          <input
            type="number"
            min="0"
            value={stage.meanRecoveryTimeSec}
            onChange={(event) =>
              onChange(stage.id, {
                meanRecoveryTimeSec: Math.max(0, Number(event.target.value)),
              })
            }
            className="block mt-1 bg-industrial-bg border border-industrial-border text-industrial-text rounded px-3 py-2 w-32"
          />
        </label>
      </div>
    )}
  </div>
);
