import React from 'react';
import { MachineConfig, MachineUtilization } from '../../types/api';

interface MachineCardProps {
  config: MachineConfig;
  utilization?: MachineUtilization;
  status?: string;
  isBottleneck?: boolean;
  isSelected?: boolean;
}

const getStatusColor = (status: string = 'UNKNOWN') => {
  switch (status) {
    case 'RUNNING': return 'bg-industrial-running';
    case 'DOWN': return 'bg-industrial-down';
    case 'STARVED': return 'bg-industrial-starved';
    case 'BLOCKED': return 'bg-industrial-blocked';
    default: return 'bg-industrial-border';
  }
};

const formatStatus = (status: string = 'UNKNOWN') => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

export const MachineCard: React.FC<MachineCardProps> = ({ config, utilization, status, isBottleneck, isSelected }) => {
  const capUtil = utilization?.capacity_utilization ?? 0;
  
  return (
    <div className={`
      flex flex-col w-32 sm:w-36 bg-industrial-panel rounded-md transition-all relative shrink-0
      ${isSelected ? 'ring-2 ring-industrial-accent bg-industrial-panel shadow-md' : 'hover:bg-industrial-panel/80 border border-transparent'}
      ${isBottleneck && !isSelected ? 'ring-1 ring-industrial-down' : ''}
      ${!isSelected && !isBottleneck ? 'border-industrial-border' : ''}
    `}>
      {/* Bottleneck indicator */}
      {isBottleneck && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-industrial-down text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm flex items-center space-x-1 whitespace-nowrap">
          <span>Bottleneck</span>
        </div>
      )}

      <div className="p-3">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-industrial-text font-semibold text-sm leading-none mb-1">{config.id}</div>
            <div className="text-industrial-muted text-xs truncate max-w-[80px]" title={config.name}>{config.name}</div>
          </div>
          <div 
            className="flex items-center space-x-1.5"
            role="status"
            aria-label={`Status: ${formatStatus(status)}`}
          >
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} aria-hidden="true" />
            <span className="text-[10px] text-industrial-muted">{formatStatus(status)}</span>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          <div className="flex justify-between items-end">
            <span className="text-industrial-muted text-[10px]">Cap Util</span>
            <span className="font-mono text-industrial-text text-xs">{capUtil.toFixed(0)}%</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-industrial-muted text-[10px]">Rate</span>
            <span className="font-mono text-industrial-text text-xs">{config.capacity_per_hour}/hr</span>
          </div>
        </div>
      </div>
    </div>
  );
};
