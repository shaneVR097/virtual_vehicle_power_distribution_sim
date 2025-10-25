import React from 'react';
import type { SystemMetrics, HistoryEntry, PowerDistribution } from '../types';
import PowerDistributionPieChart from './charts/PowerDistributionPieChart';
import KeyComponentsChart from './charts/KeyComponentsChart';
import PowerHistoryChart from './charts/PowerHistoryChart';
import BatteryHistoryChart from './charts/BatteryHistoryChart';

interface DashboardProps {
  metrics: SystemMetrics;
  history: HistoryEntry[];
  powerDistribution: PowerDistribution;
  patternChangeEvents: number[];
}

const Dashboard: React.FC<DashboardProps> = ({ metrics, history, powerDistribution, patternChangeEvents }) => {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-bold text-text-primary px-1">Dashboard</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <PowerDistributionPieChart powerDistribution={powerDistribution} />
        <KeyComponentsChart data={history} events={patternChangeEvents} />
        <PowerHistoryChart data={history} events={patternChangeEvents} />
        <BatteryHistoryChart data={history} events={patternChangeEvents} />
      </div>
    </div>
  );
};

export default Dashboard;