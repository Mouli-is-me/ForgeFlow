import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';

export const SimulationLog: React.FC = () => {
  const { state } = useSimulationStore();
  
  if (!state) return null;

  const logs = state.eventsLog.slice().reverse().slice(0, 50); // Show last 50

  return (
    <div className="bg-industrial-panel border border-industrial-border rounded shadow-sm flex flex-col h-[300px]">
      <div className="p-4 border-b border-industrial-border bg-industrial-panel/50">
        <h3 className="text-sm font-medium text-industrial-text uppercase tracking-wider">Event Log</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {logs.length === 0 ? (
          <span className="text-industrial-muted text-sm italic">No events recorded yet.</span>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="text-xs font-mono text-industrial-muted">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
