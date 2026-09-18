import React from 'react';
import { ArrowRight } from 'lucide-react';

interface BufferCardProps {
  id: string;
  capacity: number;
  utilizationPercent?: number;
}

export const BufferCard: React.FC<BufferCardProps> = ({ id, capacity, utilizationPercent = 0 }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-1 sm:px-3" aria-label={`Buffer ${id}`}>
      <div className="text-[11px] text-industrial-muted mb-1.5">{id}</div>
      <div className="w-full flex items-center space-x-1 sm:space-x-2">
        <div className="h-1.5 flex-1 bg-industrial-border rounded-full overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 h-full bg-industrial-accent transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, utilizationPercent))}%` }}
          />
        </div>
        <ArrowRight className="w-3 h-3 text-industrial-muted shrink-0" aria-hidden="true" />
      </div>
      <div className="text-[11px] font-mono text-industrial-muted mt-1.5">
        <span className="text-industrial-text">{utilizationPercent.toFixed(0)}%</span> / {capacity}
      </div>
    </div>
  );
};
