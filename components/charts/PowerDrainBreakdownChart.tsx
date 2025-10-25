import React, { useMemo } from 'react';
// Fix: Added CartesianGrid to the recharts import.
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import type { SubSystemName } from '../../types';
import { SUBSYSTEMS } from '../../constants';

interface ChartProps {
  powerTotals: Record<SubSystemName, number>;
}

const COLORS: Record<string, string> = {
    'Powertrain': '#e53e3e',
    'Chassis': '#dd6b20',
    'Lighting': '#d69e2e',
    'Climate': '#38a169',
    'Interior': '#3182ce',
    'Infotainment': '#805ad5',
};

const PowerDrainBreakdownChart: React.FC<ChartProps> = ({ powerTotals }) => {
    const data = useMemo(() => {
        const categoryTotals: Record<string, number> = {};
        for (const system of SUBSYSTEMS) {
            if (!categoryTotals[system.category]) {
                categoryTotals[system.category] = 0;
            }
            categoryTotals[system.category] += powerTotals[system.id] || 0;
        }

        return Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .filter(entry => entry.value > 0)
            .sort((a,b) => b.value - a.value);
    }, [powerTotals]);


  return (
    <div className="glass-pane p-4 h-80 w-full">
      <h3 className="text-md font-semibold text-text-primary mb-4">Power Drain Breakdown (Wh)</h3>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" horizontal={false} />
          <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} tick={{ fill: 'var(--text-secondary)' }} />
          <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" width={80} fontSize={12} tick={{ fill: 'var(--text-secondary)' }} />
          <Tooltip
            cursor={{fill: 'rgba(100,116,139,0.1)'}}
            contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', border: '1px solid var(--border-primary)', borderRadius: '0.5rem' }} 
            labelStyle={{ color: 'var(--text-primary)' }}
            formatter={(value: number) => `${value.toFixed(3)} Wh`}
          />
          <Bar dataKey="value" name="Energy Used" fill="#8884d8" barSize={20}>
            {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name] || '#A0AEC0'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PowerDrainBreakdownChart;