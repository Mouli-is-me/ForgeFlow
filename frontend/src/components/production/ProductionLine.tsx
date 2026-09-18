import React, { useState } from 'react';
import { MachineCard } from '../machine/MachineCard';
import { BufferCard } from './BufferCard';
import { LineConfig, SimulationResult, SimulationEvent } from '../../types/api';
import { MachineDrawer } from '../machine/MachineDrawer';
import { Info } from 'lucide-react';

interface ProductionLineProps {
  config: LineConfig;
  result: SimulationResult;
  events: SimulationEvent[];
  onUpdateEvents: (events: SimulationEvent[]) => void;
}

export const ProductionLine: React.FC<ProductionLineProps> = ({ config, result, events, onUpdateEvents }) => {
  const machines = config.machines;
  const lastSnapshot = result.time_series?.[result.time_series.length - 1];
  
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);

  const selectedMachineConfig = machines.find(m => m.id === selectedMachineId);
  const selectedMachineUtil = selectedMachineId ? result.machine_utilization[selectedMachineId] : undefined;
  const selectedMachineStatus = selectedMachineId ? (lastSnapshot?.machine_status?.[selectedMachineId] || 'RUNNING') : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-industrial-muted text-xs">
        <Info className="w-4 h-4" />
        <span>End of 24h simulation state. Some machines may appear blocked due to downstream accumulation.</span>
      </div>
      
      <div className="bg-industrial-panel/50 rounded-lg p-6 relative">
        <div className="flex items-stretch justify-between w-full">
          {machines.map((machine, index) => {
            const isBottleneck = result.bottleneck?.machine === machine.id;
            const status = lastSnapshot?.machine_status?.[machine.id] || 'RUNNING';
            const bufferId = `B${index + 1}`;
            const isSelected = selectedMachineId === machine.id;
            
            return (
              <React.Fragment key={machine.id}>
                {/* Machine Node */}
                <button 
                  onClick={() => setSelectedMachineId(machine.id)}
                  className="text-left focus:outline-none shrink-0"
                  aria-label={`View details for ${machine.name}`}
                >
                  <MachineCard 
                    config={machine}
                    utilization={result.machine_utilization[machine.id]}
                    status={status}
                    isBottleneck={isBottleneck}
                    isSelected={isSelected}
                  />
                </button>
                
                {/* Intermediate Buffer */}
                {index < machines.length - 1 && (
                  <BufferCard 
                    id={bufferId}
                    capacity={config.buffer_capacity}
                    utilizationPercent={result.buffer_utilization?.[bufferId]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Machine Details Drawer / Panel */}
      {selectedMachineId && selectedMachineConfig && (
        <MachineDrawer 
          config={selectedMachineConfig}
          utilization={selectedMachineUtil}
          status={selectedMachineStatus}
          isBottleneck={result.bottleneck?.machine === selectedMachineId}
          bottleneckAnalysis={result.bottleneck}
          events={events.filter(e => e.machine_id === selectedMachineId)}
          onApplyEvent={(event) => {
            const otherEvents = events.filter(e => e.machine_id !== selectedMachineId || e.type !== event.type);
            onUpdateEvents([...otherEvents, event]);
          }}
          onClearEvent={(type) => {
            onUpdateEvents(events.filter(e => e.machine_id !== selectedMachineId || e.type !== type));
          }}
          onClose={() => setSelectedMachineId(null)}
        />
      )}
    </div>
  );
};
