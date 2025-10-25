import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { HistoryEntry } from '../../types';

interface ChartProps {
  data: HistoryEntry[];
  events: number[];
}

const KeyComponentsChart: React.FC<ChartProps> = ({ data, events }) => {
    const formattedData = data.map(entry => ({
        ...entry,
        time: new Date(entry.timestamp).toLocaleTimeString(),
    }));

  return (
    <div className="glass-pane p-4 h-48 w-full">
      <h3 className="text-md font-semibold text-text-primary mb-4">Key Component Draw (W)</h3>
      <ResponsiveContainer>
        <LineChart data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
          <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={12} tick={{ fill: 'var(--text-secondary)' }} />
          <YAxis fontSize={12} tick={{ fill: 'var(--text-secondary)' }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', border: '1px solid var(--border-primary)', borderRadius: '0.5rem' }} 
            labelStyle={{ color: 'var(--text-primary)' }}
          />
          <Legend wrapperStyle={{fontSize: "12px"}}/>
          <Line type="monotone" dataKey="hvacCompressor" name="AC" stroke="#f56565" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="radiatorFan" name="Fan" stroke="#ed8936" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="powerSteering" name="Steering" stroke="#d53f8c" strokeWidth={2} dot={false} />
          {events.map(ts => {
            const timeStr = new Date(ts).toLocaleTimeString();
            return <ReferenceLine key={ts} x={timeStr} stroke="rgba(192, 132, 252, 0.7)" strokeDasharray="4 4" />;
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default KeyComponentsChart;