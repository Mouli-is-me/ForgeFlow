import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  context?: string;
  valueClass?: string;
  isAlert?: boolean;
  icon?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, unit, context, valueClass, isAlert, icon }) => {
  return (
    <div className={`flex flex-col py-2 ${isAlert ? 'text-industrial-down' : ''}`}>
      <span className="text-industrial-muted text-sm mb-1 flex items-center gap-1">
        {icon}
        {label}
      </span>
      <div className="flex items-baseline space-x-1.5 mb-1">
        <span className={`font-mono text-4xl font-medium ${valueClass || 'text-industrial-text'}`}>{value}</span>
        {unit && <span className="text-industrial-muted text-sm">{unit}</span>}
      </div>
      {context && (
        <span className="text-industrial-muted text-xs leading-tight">{context}</span>
      )}
    </div>
  );
};
