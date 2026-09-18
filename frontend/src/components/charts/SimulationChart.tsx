import React from 'react';
import { TimeSeriesData } from '../../types/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface SimulationChartProps {
  data: TimeSeriesData[];
}

export const SimulationChart: React.FC<SimulationChartProps> = ({ data }) => {
  const samplingRate = Math.max(1, Math.floor(data.length / 100));
  const chartData = data.filter((_, i) => i % samplingRate === 0).map(d => ({
    time: `T+${d.tick}m`,
    throughput: d.throughput_so_far,
    B1: d.buffers.B1,
    B2: d.buffers.B2,
    B3: d.buffers.B3,
    B4: d.buffers.B4,
  }));

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-industrial-muted h-full p-6">
        <p className="text-sm">No charting data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="mb-4">
        <h3 className="text-industrial-text font-medium">Buffer Accumulation Over Time</h3>
        <p className="text-sm text-industrial-muted mt-1">Where is material backing up during production?</p>
      </div>
      
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#a1a1aa" 
              fontSize={11} 
              tickMargin={12}
              minTickGap={30}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#a1a1aa" 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}u`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#f4f4f5', fontSize: '12px', borderRadius: '4px' }}
              itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
              labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
              iconType="circle"
              iconSize={6}
            />
            
            <Line name="Buffer 1" type="monotone" dataKey="B1" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line name="Buffer 2" type="monotone" dataKey="B2" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line name="Buffer 3" type="monotone" dataKey="B3" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line name="Buffer 4" type="monotone" dataKey="B4" stroke="#eab308" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
