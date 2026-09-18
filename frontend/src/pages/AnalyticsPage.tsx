import React from "react";
import { useSimulationStore } from "../store/useSimulationStore";
import { Activity, Clock, ServerCrash, Box } from "lucide-react";

export const AnalyticsPage: React.FC = () => {
  const { state, config, history } = useSimulationStore();

  if (!state) {
    return (
      <div className="flex-1 flex items-center justify-center bg-industrial-bg text-industrial-muted">
        No active simulation data. Run a simulation first.
      </div>
    );
  }

  const totalDowntime = Object.values(state.machines).reduce(
    (sum, m) => sum + m.timeDown,
    0,
  );
  const avgUtil =
    Object.values(state.machines).reduce((sum, m) => sum + m.utilization, 0) /
    (Object.keys(state.machines).length || 1);

  return (
    <div className="flex-1 overflow-y-auto bg-industrial-bg p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-industrial-text mb-2 tracking-wide uppercase">
            Operational Analytics
          </h1>
          <p className="text-industrial-muted">
            Historical performance metrics from the current simulation run.
          </p>
        </div>

        {history.length === 0 && (
          <div className="border border-dashed border-industrial-border rounded-lg p-5 text-sm text-industrial-muted">
            Run the simulation to generate throughput, queue pressure, and
            bottleneck history.
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-industrial-panel border border-industrial-border rounded-lg p-6">
            <h3 className="text-sm font-bold text-industrial-text uppercase tracking-wider mb-5">
              Throughput over time
            </h3>
            <div
              className="flex items-end gap-1 h-32"
              aria-label="Throughput history"
            >
              {history.slice(-60).map((point, index) => {
                const peak = Math.max(
                  ...history.map((item) => item.throughputPerHour),
                  1,
                );
                return (
                  <div
                    key={`${point.timeSec}-${index}`}
                    title={`${point.throughputPerHour.toFixed(1)} units/hr`}
                    className="flex-1 min-w-[3px] bg-industrial-accent/70 hover:bg-industrial-accent"
                    style={{
                      height: `${Math.max(3, (point.throughputPerHour / peak) * 100)}%`,
                    }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-industrial-muted mt-2">
              <span>Earlier</span>
              <span>Latest</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Throughput"
            value={`${state.throughputPerHour.toFixed(1)} u/hr`}
            icon={<Activity />}
          />
          <StatCard
            title="Total Completed"
            value={`${state.totalCompleted} units`}
            icon={<Box />}
          />
          <StatCard
            title="Avg Utilization"
            value={`${(avgUtil * 100).toFixed(1)}%`}
            icon={<Clock />}
          />
          <StatCard
            title="Total Downtime"
            value={`${totalDowntime} sec`}
            icon={<ServerCrash />}
            alert={totalDowntime > 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-industrial-panel border border-industrial-border rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-bold text-industrial-text uppercase tracking-wider mb-6">
              Stage Utilization Breakdown
            </h3>
            <div className="space-y-4">
              {config.stages.map((stage) => {
                const m = state.machines[stage.id];
                const util = (m?.utilization || 0) * 100;
                return (
                  <div key={stage.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-industrial-muted">
                        {stage.name}
                      </span>
                      <span className="text-industrial-text font-mono">
                        {util.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-industrial-bg rounded overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${util}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-industrial-panel border border-industrial-border rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-bold text-industrial-text uppercase tracking-wider mb-6">
              Queue Pressures
            </h3>
            <div className="space-y-4">
              {Object.values(state.queues).map((q) => {
                const fill = (q.currentUnits / q.maxCapacity) * 100;
                return (
                  <div key={q.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-industrial-muted">
                        {q.sourceId} → {q.targetId}
                      </span>
                      <span className="text-industrial-text font-mono">
                        {q.currentUnits} / {q.maxCapacity}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-industrial-bg rounded overflow-hidden">
                      <div
                        className={`h-full transition-all ${fill > 80 ? "bg-orange-500" : "bg-industrial-muted"}`}
                        style={{ width: `${fill}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  alert?: boolean;
}> = ({ title, value, icon, alert }) => (
  <div
    className={`bg-industrial-panel border ${alert ? "border-amber-500/50" : "border-industrial-border"} p-6 rounded-lg shadow-sm flex flex-col gap-4`}
  >
    <div
      className={`flex justify-between items-start ${alert ? "text-amber-500" : "text-industrial-muted"}`}
    >
      <span className="text-xs font-bold uppercase tracking-wider">
        {title}
      </span>
      <div className="opacity-50 w-5 h-5">{icon}</div>
    </div>
    <span
      className={`text-3xl font-mono ${alert ? "text-amber-500" : "text-industrial-text"}`}
    >
      {value}
    </span>
  </div>
);
