import React from 'react';
import { BottleneckAnalysis } from '../../types/api';

interface BottleneckPanelProps {
  analysis?: BottleneckAnalysis;
  interventions?: string[];
}

export const BottleneckPanel: React.FC<BottleneckPanelProps> = ({ analysis, interventions = [] }) => {
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center text-industrial-muted h-full">
        <p className="text-sm">No bottleneck data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-industrial-border">
        <div className="w-2 h-8 bg-industrial-down rounded-sm" aria-hidden="true" />
        <div>
          <h3 className="text-industrial-text text-xl font-medium">Machine {analysis.machine} is the constraint</h3>
          <span className="text-industrial-muted text-sm">Primary bottleneck identified in 24h simulation</span>
        </div>
      </div>
      
      <div className="space-y-6 max-w-2xl">
        <section aria-labelledby="bn-why">
          <h4 id="bn-why" className="text-industrial-text font-medium mb-1">Why is the line constrained?</h4>
          <p className="text-industrial-muted text-sm leading-relaxed">
            {analysis.reason}
          </p>
        </section>

        <section aria-labelledby="bn-impact">
          <h4 id="bn-impact" className="text-industrial-text font-medium mb-2">What is the consequence?</h4>
          <div className="flex space-x-12">
            <div>
              <span className="block text-industrial-muted text-xs mb-1">Restricted Throughput</span>
              <span className="font-mono text-industrial-text text-xl">{analysis.line_throughput.toFixed(1)} <span className="text-sm text-industrial-muted">/hr</span></span>
            </div>
            <div>
              <span className="block text-industrial-muted text-xs mb-1">Upstream Queue Pressure</span>
              <span className="font-mono text-industrial-starved text-xl">{analysis.upstream_queue_pressure.toFixed(1)}%</span>
            </div>
          </div>
        </section>

        {interventions.length > 0 && (
          <section aria-labelledby="bn-action">
            <h4 id="bn-action" className="text-industrial-text font-medium mb-2">What can we test?</h4>
            <ul className="space-y-2 list-none">
              {interventions.map((int, i) => (
                <li key={i} className="text-sm text-industrial-muted flex items-start space-x-2">
                  <span className="text-industrial-accent mt-0.5">→</span>
                  <span>{int}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};
