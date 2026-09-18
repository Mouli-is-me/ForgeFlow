import React, { useState } from 'react';
import { MachineConfig, MachineUtilization, BottleneckAnalysis, SimulationEvent } from '../../types/api';
import { X, Activity, Clock, AlertOctagon, Settings2 } from 'lucide-react';

interface MachineDrawerProps {
  config: MachineConfig;
  utilization?: MachineUtilization;
  status?: string;
  isBottleneck?: boolean;
  bottleneckAnalysis?: BottleneckAnalysis;
  events?: SimulationEvent[];
  onApplyEvent?: (event: SimulationEvent) => void;
  onClearEvent?: (type: string) => void;
  onClose: () => void;
}

const formatStatus = (status: string = 'UNKNOWN') => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

export const MachineDrawer: React.FC<MachineDrawerProps> = ({ 
  config, utilization, status, isBottleneck, bottleneckAnalysis, events = [], onApplyEvent, onClearEvent, onClose 
}) => {
  const capEvent = events.find(e => e.type === 'capacity_change');
  const currentCapValue = capEvent?.value ? Math.round(capEvent.value * 100) : 100;
  
  const [capInput, setCapInput] = useState(currentCapValue.toString());

  const handleApplyCap = () => {
    const val = parseInt(capInput);
    if (!isNaN(val) && val > 0 && onApplyEvent) {
      if (val === 100) {
        if (onClearEvent) onClearEvent('capacity_change');
      } else {
        onApplyEvent({
          tick: 0,
          type: 'capacity_change',
          machine_id: config.id,
          value: val / 100.0
        });
      }
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-industrial-panel border-l border-industrial-border shadow-2xl z-50 flex flex-col transform transition-transform">
      <div className="flex items-center justify-between p-6 border-b border-industrial-border bg-industrial-bg">
        <div>
          <h2 className="text-xl font-medium text-industrial-text">{config.id}</h2>
          <span className="text-sm text-industrial-muted">{config.name}</span>
        </div>
        <button 
          onClick={onClose}
          className="text-industrial-muted hover:text-industrial-text p-1 transition-colors rounded-full hover:bg-industrial-border"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {/* Scenario Controls */}
        <div className="mb-8 p-4 bg-industrial-bg border border-industrial-border rounded-md">
          <div className="flex items-center space-x-2 text-industrial-accent mb-4">
            <Settings2 className="w-4 h-4" />
            <h3 className="text-sm font-medium">Scenario Condition</h3>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs text-industrial-muted block">Capacity Multiplier (%)</label>
            <div className="flex space-x-2">
              <input 
                type="number" 
                value={capInput}
                onChange={(e) => setCapInput(e.target.value)}
                className="flex-1 bg-industrial-panel border border-industrial-border rounded px-3 py-1.5 text-sm text-industrial-text focus:outline-none focus:border-industrial-accent"
                min="10"
                max="300"
              />
              <button 
                onClick={handleApplyCap}
                className="px-4 py-1.5 bg-industrial-accent/10 text-industrial-accent hover:bg-industrial-accent hover:text-white transition-colors text-sm font-medium rounded border border-industrial-accent/50"
              >
                Test
              </button>
              {currentCapValue !== 100 && onClearEvent && (
                <button 
                  onClick={() => {
                    setCapInput('100');
                    onClearEvent('capacity_change');
                  }}
                  className="px-3 py-1.5 bg-industrial-panel text-industrial-muted hover:text-industrial-text transition-colors text-sm font-medium rounded border border-industrial-border"
                >
                  Reset
                </button>
              )}
            </div>
            {currentCapValue !== 100 && (
              <p className="text-[10px] text-industrial-accent mt-1">
                Active condition: {currentCapValue}% capacity.
              </p>
            )}
          </div>
        </div>

        {/* State Summary */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-industrial-text mb-4">Current State</h3>
          <div className="grid grid-cols-2 gap-px bg-industrial-border rounded overflow-hidden">
            <div className="bg-industrial-panel p-4">
              <span className="block text-xs text-industrial-muted mb-1">Status</span>
              <span className={`font-medium ${status === 'RUNNING' ? 'text-industrial-running' : status === 'DOWN' ? 'text-industrial-down' : 'text-industrial-starved'}`}>
                {formatStatus(status)}
              </span>
            </div>
            <div className="bg-industrial-panel p-4">
              <span className="block text-xs text-industrial-muted mb-1">Capacity</span>
              <span className="font-mono text-industrial-text">
                {currentCapValue !== 100 ? (
                  <span>
                    <span className="line-through text-industrial-border mr-2">{config.capacity_per_hour}</span>
                    <span className="text-industrial-accent">{Math.round(config.capacity_per_hour * (currentCapValue/100))}</span>
                  </span>
                ) : (
                  config.capacity_per_hour
                )} <span className="text-xs text-industrial-muted">/hr</span>
              </span>
            </div>
          </div>
        </div>

        {/* Utilization */}
        {utilization && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-industrial-text mb-4">Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-industrial-text text-sm">
                  <Activity className="w-4 h-4 text-industrial-accent" />
                  <span>Capacity Utilization</span>
                </div>
                <span className="font-mono font-medium text-industrial-text">{utilization.capacity_utilization.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-industrial-text text-sm">
                  <Clock className="w-4 h-4 text-industrial-accent" />
                  <span>Time Utilization</span>
                </div>
                <span className="font-mono font-medium text-industrial-text">{utilization.time_utilization.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottleneck Explanation (if applicable) */}
        {isBottleneck && bottleneckAnalysis && (
          <div className="mt-8 border border-industrial-down/30 bg-industrial-down/5 rounded-md p-5 space-y-4">
            <div className="flex items-center space-x-2 text-industrial-down">
              <AlertOctagon className="w-5 h-5" />
              <h3 className="font-medium">System Constraint</h3>
            </div>
            <p className="text-sm text-industrial-text leading-relaxed">
              {bottleneckAnalysis.reason}
            </p>
            <div className="pt-4 border-t border-industrial-down/20 grid grid-cols-2 gap-4 text-sm">
               <div>
                 <span className="block text-xs text-industrial-down/80 mb-1">Throughput</span>
                 <span className="font-mono text-industrial-down font-medium">{bottleneckAnalysis.line_throughput.toFixed(1)} /hr</span>
               </div>
               <div>
                 <span className="block text-xs text-industrial-down/80 mb-1">Queue Pressure</span>
                 <span className="font-mono text-industrial-down font-medium">{bottleneckAnalysis.upstream_queue_pressure.toFixed(1)}%</span>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
