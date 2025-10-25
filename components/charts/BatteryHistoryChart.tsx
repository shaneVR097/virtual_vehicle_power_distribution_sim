import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { HistoryEntry } from '../../types';

interface ChartProps {
  data: HistoryEntry[];
  events: number[];
}

const BatteryHistoryChart: React.FC<ChartProps> = ({ data, events }) => {
    const formattedData = data.map(entry => ({
        ...entry,
        time: new Date(entry.timestamp).toLocaleTimeString(),
    }));

  return (
    <div className="glass-pane p-4 h-48 w-full">
      <h3 className="text-md font-semibold text-text-primary mb-4">Battery Charge (%)</h3>
      <ResponsiveContainer>
        <AreaChart data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#48bb78" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#48bb78" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
          <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={12} tick={{ fill: 'var(--text-secondary)' }} />
          <YAxis stroke="#48bb78" fontSize={12} domain={[0, 100]} tick={{ fill: 'var(--text-secondary)' }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', border: '1px solid var(--border-primary)', borderRadius: '0.5rem' }} 
            labelStyle={{ color: 'var(--text-primary)' }}
            itemStyle={{ color: '#48bb78' }}
          />
          <Area type="monotone" dataKey="batteryCharge" name="Battery" stroke="#48bb78" fill="url(#colorBattery)" strokeWidth={2} dot={false} />
          {events.map(ts => {
            const timeStr = new Date(ts).toLocaleTimeString();
            return <ReferenceLine key={ts} x={timeStr} stroke="rgba(192, 132, 252, 0.7)" strokeDasharray="4 4" />;
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BatteryHistoryChart;