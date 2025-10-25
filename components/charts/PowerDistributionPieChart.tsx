import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { PowerDistribution } from '../../types';
import { SUBSYSTEMS } from '../../constants';

interface ChartProps {
  powerDistribution: PowerDistribution;
}

const COLORS: Record<string, string> = {
    'Powertrain': '#e53e3e',
    'Chassis': '#dd6b20',
    'Lighting': '#d69e2e',
    'Climate': '#38a169',
    'Interior': '#3182ce',
    'Infotainment': '#805ad5',
};

const PowerDistributionPieChart: React.FC<ChartProps> = ({ powerDistribution }) => {
    const data = useMemo(() => {
        const categoryTotals: Record<string, number> = {};
        for (const system of SUBSYSTEMS) {
            if (!categoryTotals[system.category]) {
                categoryTotals[system.category] = 0;
            }
            categoryTotals[system.category] += powerDistribution[system.id] || 0;
        }

        return Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .filter(entry => entry.value > 1); // Only show categories with significant draw
    }, [powerDistribution]);

    const totalPower = data.reduce((sum, entry) => sum + entry.value, 0);

    if (totalPower < 1) {
        return (
            <div className="glass-pane p-4 h-48 w-full flex items-center justify-center">
                <p className="text-text-secondary italic">No significant power draw</p>
            </div>
        )
    }

  return (
    <div className="glass-pane p-4 h-48 w-full">
      <h3 className="text-md font-semibold text-text-primary mb-4">Power Distribution by Category</h3>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={60}
            innerRadius={30}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name] || '#A0AEC0'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', border: '1px solid var(--border-primary)', borderRadius: '0.5rem' }} 
            formatter={(value: number) => `${value.toFixed(0)}W`}
          />
           <Legend wrapperStyle={{fontSize: "12px"}}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PowerDistributionPieChart;