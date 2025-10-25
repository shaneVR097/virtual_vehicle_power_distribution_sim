import React from 'react';
import type { SimulationSummary, SimulationSnapshot } from '../types';
import PowerHistoryChart from './charts/PowerHistoryChart';
import { SUBSYSTEMS } from '../constants';
import { SunIcon, MoonIcon, SunsetIcon, CloudIcon, CloudRainIcon, SnowflakeIcon, BuildingIcon, HomeIcon, RoadIcon, MountainIcon, MinusIcon, TrendingUpIcon, TrendingDownIcon, PowerIcon, BatteryChargingIcon, ThermometerIcon, ZapIcon } from './Icons';

// Helper to format time for the report
const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const ConfigDisplay: React.FC<{ title: string, data: object }> = ({ title, data }) => (
    <div>
        <h4 className="font-bold text-lg text-sky-400 mb-2">{title}</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-gray-700/50 py-0.5">
                    <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <strong className="text-gray-100">{String(value)}</strong>
                </div>
            ))}
        </div>
    </div>
);

const SnapshotCard: React.FC<{ snapshot: SimulationSnapshot }> = ({ snapshot }) => {
    const { scenario, systemMetrics, carState, elapsedTime } = snapshot;

    const timeIcon = { Day: <SunIcon />, Dusk: <SunsetIcon />, Night: <MoonIcon /> }[scenario.timeOfDay];
    const weatherIcon = { Sunny: <SunIcon className="text-yellow-400" />, Cloudy: <CloudIcon />, Rainy: <CloudRainIcon />, Snowy: <SnowflakeIcon /> }[scenario.weather];
    const regionIcon = { City: <BuildingIcon />, Suburban: <HomeIcon />, Highway: <RoadIcon />, 'Off-road': <MountainIcon /> }[scenario.region];
    const terrainIcon = { Flat: <MinusIcon />, Uphill: <TrendingUpIcon />, Downhill: <TrendingDownIcon /> }[scenario.terrain];

    return (
        <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-lg">
            <h5 className="font-bold text-md text-sky-400 border-b border-gray-600 pb-1 mb-2">Snapshot @ {formatTime(elapsedTime)}</h5>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5"><div className="w-4">{timeIcon}</div> {scenario.timeOfDay}</div>
                <div className="flex items-center gap-1.5"><div className="w-4">{weatherIcon}</div> {scenario.weather}</div>
                <div className="flex items-center gap-1.5"><div className="w-4">{regionIcon}</div> {scenario.region}</div>
                <div className="flex items-center gap-1.5"><div className="w-4">{terrainIcon}</div> {scenario.terrain}</div>
            </div>
            <div className="border-t border-gray-600 mt-2 pt-2 grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-semibold text-gray-400">Speed:</span> {carState.speed.toFixed(0)} km/h</div>
                <div><span className="font-semibold text-gray-400">Action:</span> {carState.action}</div>
                <div><span className="font-semibold text-gray-400">Power:</span> {systemMetrics.totalPowerDraw.toFixed(0)} W</div>
                <div><span className="font-semibold text-gray-400">Battery:</span> {systemMetrics.batteryCharge.toFixed(1)}%</div>
            </div>
        </div>
    );
};

interface ReportProps {
    summary: SimulationSummary;
    snapshots: SimulationSnapshot[];
}

const Report: React.FC<ReportProps> = ({ summary, snapshots }) => {

    const powerByCategory = React.useMemo(() => {
        const categoryTotals: Record<string, number> = {};
        for (const system of SUBSYSTEMS) {
            if (!categoryTotals[system.category]) categoryTotals[system.category] = 0;
            categoryTotals[system.category] += summary.powerTotals[system.id] || 0;
        }
        return Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .filter(entry => entry.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [summary.powerTotals]);

    return (
        <div id="simulation-report-content" className="bg-[#0a0e14] text-gray-200 font-sans p-8" style={{ width: '1024px' }}>
            <div className="border-4 border-sky-500 p-6">
                <header className="text-center mb-8">
                    <h1 className="text-5xl font-black text-white tracking-tight">Simulation Report</h1>
                    <p className="mt-2 text-lg text-gray-400">Intelligent Power Distribution Analysis</p>
                    <p className="text-sm text-gray-500">{new Date().toLocaleString()}</p>
                </header>

                <section className="mb-8 grid grid-cols-2 gap-8">
                    <ConfigDisplay title="Vehicle Configuration" data={summary.vehicleConfig} />
                    <ConfigDisplay title="Initial Environment" data={{ timeOfDay: summary.scenario.timeOfDay, weather: summary.scenario.weather, region: summary.scenario.region, terrain: summary.scenario.terrain }} />
                </section>

                <section className="mb-8 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Duration</p><p className="text-2xl font-bold">{formatTime(summary.duration)}</p></div>
                    <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Avg. Power Draw</p><p className="text-2xl font-bold">{summary.avgPowerDraw.toFixed(0)} W</p></div>
                    <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Peak Power Draw</p><p className="text-2xl font-bold">{summary.peakPowerDraw.toFixed(0)} W</p></div>
                    <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Final Battery</p><p className="text-2xl font-bold">{summary.finalBattery.toFixed(1)} %</p></div>
                    <div className="bg-red-900/50 p-4 rounded-lg"><p className="text-sm text-red-300">Overload Events</p><p className="text-2xl font-bold text-red-300">{summary.overloadEvents}</p></div>
                    <div className="bg-orange-900/50 p-4 rounded-lg"><p className="text-sm text-orange-300">Temp Warnings</p><p className="text-2xl font-bold text-orange-300">{summary.tempWarnings}</p></div>
                </section>

                <section className="mb-8">
                    <h3 className="text-2xl font-bold text-white mb-4 text-center">Power History</h3>
                    <div className="h-64 bg-gray-900/50 p-2 rounded-lg">
                        <PowerHistoryChart data={summary.history} events={[]} isAnimationActive={false} />
                    </div>
                </section>
                
                <section className="mb-8 grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-4 text-center">Energy Breakdown</h3>
                        <div className="bg-gray-900/50 p-4 rounded-lg space-y-2">
                             {powerByCategory.map(cat => (
                                <div key={cat.name} className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-gray-300">{cat.name}</span>
                                    <span className="font-mono text-sky-400">{cat.value.toFixed(3)} Wh</span>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-2xl font-bold text-white mb-4 text-center">Key Moments</h3>
                        <div className="space-y-3">
                             {snapshots.map(snap => <SnapshotCard key={snap.elapsedTime} snapshot={snap} />)}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Report;
