import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  unit: string;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, unit, colorClass }) => {
  return (
    <div className="glass-pane p-3 flex items-center h-full pointer-events-auto">
      <div className={`p-2.5 rounded-lg mr-3 ${colorClass}`}>
        {icon}
      </div>
      <div className="overflow-hidden">
        <p className="text-xs text-text-secondary font-medium truncate">{title}</p>
        <p className="text-xl font-bold text-text-primary">
          {value} <span className="text-base font-medium text-text-secondary">{unit}</span>
        </p>
      </div>
    </div>
  );
};

export default StatCard;
