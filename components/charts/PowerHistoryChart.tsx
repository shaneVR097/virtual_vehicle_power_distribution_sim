import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { HistoryEntry } from '../../types';

interface ChartProps {
  data: HistoryEntry[];
  events: number[];
  isAnimationActive?: boolean;
}

const PowerHistoryChart: React.FC<ChartProps> = ({ data, events, isAnimationActive = true }) => {
    const formattedData = data.map(entry => ({
        ...entry,
        time: new Date(entry.timestamp).toLocaleTimeString(),
    }));

  return (
    <div className="glass-pane p-4 h-64 w-full">
      <h3 className="text-md font-semibold text-text-primary mb-4">Total Power Draw (W)</h3>
      <ResponsiveContainer>
        <AreaChart data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
          <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={12} tick={{ fill: 'var(--text-secondary)' }} />
          <YAxis stroke="#38bdf8" fontSize={12} tick={{ fill: 'var(--text-secondary)' }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', border: '1px solid var(--border-primary)', borderRadius: '0.5rem' }} 
            labelStyle={{ color: 'var(--text-primary)' }}
            itemStyle={{ color: '#38bdf8' }}
          />
          <Area type="monotone" dataKey="totalPowerDraw" name="Power" stroke="#38bdf8" fill="url(#colorPower)" strokeWidth={2} dot={false} isAnimationActive={isAnimationActive} />
           {events.map(ts => {
            const timeStr = new Date(ts).toLocaleTimeString();
            return <ReferenceLine key={ts} x={timeStr} stroke="rgba(192, 132, 252, 0.7)" strokeDasharray="4 4" />;
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PowerHistoryChart;