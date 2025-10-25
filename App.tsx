
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ControlPanel from './components/ControlPanel';
import CarVisualization from './components/CarVisualization';
import Dashboard from './components/Dashboard';
import SetupModal from './components/SetupModal';
import { AlertTriangleIcon, ClockIcon } from './components/Icons';
import { SimulationState, CarAction, CarType, Powertrain, VoltageSystem, TimeOfDay, Weather, Region, CAR_SUBTYPES, DrivingStyle, RoadCondition, TrafficDensity, Terrain } from './types';
import type { VehicleConfig, Scenario, CarState, SystemMetrics, PowerDistribution, Alert, HistoryEntry, SubSystemName, SimulationSummary, SimulationSnapshot } from './types';
// FIX: Removed non-existent voltage constants and added getBatteryParameters
import { INITIAL_POWER_DISTRIBUTION, SIMULATION_TICK_RATE_MS, SUBSYSTEMS, getBatteryParameters } from './constants';
import { runSimulationTick, forceUpdateScenario } from './services/simulationService';
import { generateReport } from './services/reportService';
import PowerHistoryChart from './components/charts/PowerHistoryChart';
import BatteryHistoryChart from './components/charts/BatteryHistoryChart';
import PowerDrainBreakdownChart from './components/charts/PowerDrainBreakdownChart';

const AlertLog: React.FC<{alerts: Alert[]}> = ({ alerts }) => (
    <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold text-text-primary px-1 flex items-center"><AlertTriangleIcon className="w-5 h-5 mr-2 text-red-400"/>Active Alerts</h3>
        <div className="glass-pane p-4 h-40 overflow-y-auto space-y-2">
             {alerts.length > 0 ? alerts.map(alert => (
                <div key={alert.id} className="text-sm bg-red-900/50 border-l-4 border-red-500 p-2 rounded-r-md">
                    <p className="text-red-300 font-semibold">{new Date(alert.timestamp).toLocaleTimeString()}: <span className="font-normal text-red-400">{alert.message}</span></p>
                </div>
            )).reverse() : <p className="text-text-secondary text-center italic mt-4">No active alerts.</p>}
        </div>
    </div>
);

const SummaryModal: React.FC<{ summary: SimulationSummary | null; onClose: () => void }> = ({ summary, onClose }) => {
    if (!summary) return null;
    
    const ConfigDisplay: React.FC<{title: string, data: object}> = ({title, data}) => (
        <div>
            <h4 className="font-bold text-lg text-accent-blue mb-2">{title}</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-gray-700/50 py-0.5">
                    <span className="text-text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <strong className="text-text-primary">{String(value)}</strong>
                </div>
            ))}
            </div>
        </div>
    )

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="glass-pane p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-3xl font-bold text-white mb-4">Simulation Report</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <ConfigDisplay title="Vehicle Configuration" data={summary.vehicleConfig} />
                    <ConfigDisplay title="Environment Snapshot" data={{
                        timeOfDay: summary.scenario.timeOfDay,
                        weather: summary.scenario.weather,
                        region: summary.scenario.region,
                        terrain: summary.scenario.terrain,
                    }}/>
                </div>
                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-center mb-6">
                    <div className="glass-pane p-3"><p className="text-sm text-text-secondary">Duration</p><p className="text-xl font-bold">{summary.duration}s</p></div>
                    <div className="glass-pane p-3"><p className="text-sm text-text-secondary">Avg. Power</p><p className="text-xl font-bold">{summary.avgPowerDraw.toFixed(0)}W</p></div>
                    <div className="glass-pane p-3"><p className="text-sm text-text-secondary">Peak Power</p><p className="text-xl font-bold">{summary.peakPowerDraw.toFixed(0)}W</p></div>
                    <div className="glass-pane p-3"><p className="text-sm text-text-secondary">Final Battery</p><p className="text-xl font-bold">{summary.finalBattery.toFixed(1)}%</p></div>
                    <div className="glass-pane p-3"><p className="text-sm text-text-secondary text-red-400">Overloads</p><p className="text-xl font-bold text-red-400">{summary.overloadEvents}</p></div>
                    <div className="glass-pane p-3"><p className="text-sm text-text-secondary text-orange-400">Temp Warnings</p><p className="text-xl font-bold text-orange-400">{summary.tempWarnings}</p></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                   <PowerHistoryChart data={summary.history} events={[]} />
                   <BatteryHistoryChart data={summary.history} events={[]} />
                </div>
                <PowerDrainBreakdownChart powerTotals={summary.powerTotals} />
                <button onClick={onClose} className="mt-6 w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold transition-colors">Close</button>
            </div>
        </div>
    );
};

const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const SimulationHeader: React.FC<{
    virtualElapsedTime: number;
    virtualDuration: number;
    actualElapsedTime: number;
    actualDuration: number;
    wallClockElapsedTime: number;
    simulationState: SimulationState;
}> = ({ virtualElapsedTime, virtualDuration, actualElapsedTime, actualDuration, wallClockElapsedTime, simulationState }) => {
    const progress = virtualDuration > 0 ? (virtualElapsedTime / virtualDuration) * 100 : 0;
    
    let progressBarColor = 'bg-gray-800';
    let progressFillColor = 'bg-gray-500';
    if (simulationState === SimulationState.Running) {
        progressFillColor = 'bg-gradient-to-r from-red-500 via-yellow-500 to-green-500';
    } else if (simulationState === SimulationState.Paused) {
        progressFillColor = 'bg-blue-500';
    }

    return (
        <header className="mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Intelligent Power Distribution Simulator</h1>
                    <p className="mt-1 text-lg text-text-secondary">Visualizing rule-based and AI-driven automotive power management.</p>
                </div>
                <div className="flex flex-col items-end gap-2 mt-2 sm:mt-0">
                    <div className="flex gap-4 glass-pane p-2 px-4 text-sm font-semibold">
                        <div className="flex items-center gap-2" title="Virtual Simulation Time"><ClockIcon className="w-4 h-4 text-sky-400" /><span>{formatTime(virtualElapsedTime)} / {formatTime(virtualDuration)}</span></div>
                        <div className="flex items-center gap-2" title="Actual Simulated Time"><ClockIcon className="w-4 h-4 text-amber-400" /><span>{formatTime(actualElapsedTime)} / {formatTime(actualDuration)}</span></div>
                        <div className="flex items-center gap-2" title="Wall Clock Time"><ClockIcon className="w-4 h-4 text-gray-400" /><span>{formatTime(wallClockElapsedTime)}</span></div>
                    </div>
                </div>
            </div>
            <div className={`w-full ${progressBarColor} rounded-full h-1.5 mt-2`}>
                <div className={`h-1.5 rounded-full ${progressFillColor} transition-all duration-500`} style={{ width: `${progress}%` }}></div>
            </div>
        </header>
    );
};


const App: React.FC = () => {
    const [simulationState, setSimulationState] = useState<SimulationState>(SimulationState.Stopped);
    const [autoScenario, setAutoScenario] = useState(true);
    const [drivingStyle, setDrivingStyle] = useState<DrivingStyle>(DrivingStyle.Normal);
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    
    const getDefaultVehicleConfig = (): VehicleConfig => ({
        carType: CarType.Sedan,
        subType: CAR_SUBTYPES[CarType.Sedan][0],
        powertrain: Powertrain.ICE,
        voltageSystem: VoltageSystem['12V'],
    });

    const getDefaultScenario = (): Scenario => ({
        timeOfDay: TimeOfDay.Day,
        weather: Weather.Sunny,
        region: Region.Suburban,
        traffic: TrafficDensity.Medium,
        roadCondition: RoadCondition.Dry,
        outsideTemp: 22,
        terrain: Terrain.Flat,
    });
    
    const getDefaultCarState = (): CarState => ({
        speed: 0,
        action: CarAction.Idle,
        hvacOn: false,
        lightsOn: false,
        wipersOn: false,
        seatHeatersOn: false,
        isIgnitionCycle: true,
    });

    const getDefaultSystemMetrics = (config: VehicleConfig): SystemMetrics => {
        // FIX: Use getBatteryParameters to get nominal voltage correctly.
        const batteryParams = getBatteryParameters(config);
        return {
            batteryCharge: 100,
            batterySoh: 100,
            batteryVoltage: batteryParams.nominalVoltage,
            batteryCurrent: 0,
            systemTemp: 25,
            totalPowerDraw: 0,
            availablePower: config.voltageSystem === '48V' ? 6000 : 3000,
        };
    };

    const [vehicleConfig, setVehicleConfig] = useState<VehicleConfig>(getDefaultVehicleConfig());
    const [scenario, setScenario] = useState<Scenario>(getDefaultScenario());
    const [carState, setCarState] = useState<CarState>(getDefaultCarState());
    const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>(getDefaultSystemMetrics(vehicleConfig));
    const [powerDistribution, setPowerDistribution] = useState<PowerDistribution>(INITIAL_POWER_DISTRIBUTION);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [activatedSystems, setActivatedSystems] = useState<SubSystemName[]>([]);
    const [summary, setSummary] = useState<SimulationSummary | null>(null);
    const [powerTotals, setPowerTotals] = useState<Record<SubSystemName, number>>({} as Record<SubSystemName, number>);
    const [patternChangeEvents, setPatternChangeEvents] = useState<number[]>([]);
    
    const [virtualDuration, setVirtualDuration] = useState(300);
    const [virtualElapsedTime, setVirtualElapsedTime] = useState(0);
    const [actualDuration, setActualDuration] = useState(3600);
    const [actualElapsedTime, setActualElapsedTime] = useState(0);
    const [wallClockElapsedTime, setWallClockElapsedTime] = useState(0);

    const [snapshots, setSnapshots] = useState<SimulationSnapshot[]>([]);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    const simulationIntervalRef = useRef<number | null>(null);
    const realTimeIntervalRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const alertCountRef = useRef({ overload: 0, temp: 0 });
    const initialConfigRef = useRef({ vehicle: getDefaultVehicleConfig(), scenario: getDefaultScenario()});

    const powerDistributionRef = useRef(powerDistribution);
    useEffect(() => { powerDistributionRef.current = powerDistribution; }, [powerDistribution]);

    const snapshotIntervals = useRef([0.2, 0.4, 0.6, 0.8, 1.0]);
    const snapshotsTaken = useRef<number[]>([]);
    
    const handleStop = useCallback(async (isNaturalCompletion = false) => {
        if (simulationState === SimulationState.Stopped) return;

        setSimulationState(SimulationState.Stopped);
        const finalElapsedTime = virtualElapsedTime;
        const duration = Math.round(finalElapsedTime);
        
        if (duration > 0) {
            setIsGeneratingReport(true);
            const avgPowerDraw = history.length > 0 ? history.reduce((sum, h) => sum + h.totalPowerDraw, 0) / history.length : 0;
            const peakPowerDraw = history.length > 0 ? Math.max(...history.map(h => h.totalPowerDraw)) : 0;
            
            const summaryData: SimulationSummary = {
                duration,
                avgPowerDraw,
                peakPowerDraw,
                finalBattery: systemMetrics.batteryCharge,
                overloadEvents: alertCountRef.current.overload,
                tempWarnings: alertCountRef.current.temp,
                vehicleConfig: initialConfigRef.current.vehicle,
                scenario: initialConfigRef.current.scenario,
                history: [...history],
                powerTotals,
            };

            const finalSnapshots = [...snapshots];
            if (!isNaturalCompletion && snapshotsTaken.current.slice(-1)[0] !== 1.0) {
                 finalSnapshots.push({ elapsedTime: duration, carState, systemMetrics, scenario });
            }
            
            await generateReport(summaryData, finalSnapshots);
            setSummary(summaryData); // For modal display
            setIsGeneratingReport(false);
        }
        
        resetState(vehicleConfig);
    }, [simulationState, virtualElapsedTime, history, systemMetrics.batteryCharge, powerTotals, snapshots, carState, scenario, vehicleConfig]);

    const tick = useCallback(async () => {
        const newVirtualElapsedTime = virtualElapsedTime + (SIMULATION_TICK_RATE_MS / 1000);
        
        const speedMultiplier = actualDuration > 0 && virtualDuration > 0 ? actualDuration / virtualDuration : 1;
        const actualTimeIncrement = (SIMULATION_TICK_RATE_MS / 1000) * speedMultiplier;
        setActualElapsedTime(prev => prev + actualTimeIncrement);
        
        const { nextCarState, nextSystemMetrics, nextPowerDistribution, newAlerts, nextScenario } = runSimulationTick(vehicleConfig, carState, systemMetrics, scenario, autoScenario, drivingStyle, alerts);
        
        setCarState(nextCarState);
        setSystemMetrics(nextSystemMetrics);
        setPowerDistribution(nextPowerDistribution);
        setScenario(nextScenario);

        setPowerTotals(prevTotals => {
            const newTotals = {...prevTotals};
            for (const key in nextPowerDistribution) {
                const subSystem = key as SubSystemName;
                newTotals[subSystem] = (newTotals[subSystem] || 0) + nextPowerDistribution[subSystem] * (SIMULATION_TICK_RATE_MS / 1000 / 3600); // Watt-hours
            }
            return newTotals;
        });

        const justActivated = SUBSYSTEMS.filter(s => !s.isConstant).filter(s => nextPowerDistribution[s.id] > 0 && powerDistributionRef.current[s.id] === 0).map(s => s.id);
        if(justActivated.length > 0) setActivatedSystems(justActivated);
        
        if (newAlerts.length > 0) {
            setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
            newAlerts.forEach(alert => {
                if (alert.message.includes('OVERLOAD') || alert.message.includes('breach')) alertCountRef.current.overload++;
                if (alert.message.includes('Temperature')) alertCountRef.current.temp++;
            });
        }

        setHistory(prev => [...prev.slice(-100), {
            timestamp: Date.now(),
            totalPowerDraw: nextSystemMetrics.totalPowerDraw,
            batteryCharge: nextSystemMetrics.batteryCharge,
            systemTemp: nextSystemMetrics.systemTemp,
            hvacCompressor: nextPowerDistribution.hvacCompressor,
            radiatorFan: nextPowerDistribution.radiatorFan,
            powerSteering: nextPowerDistribution.powerSteering,
        }]);

        const progress = newVirtualElapsedTime / virtualDuration;
        const nextSnapshotMark = snapshotIntervals.current.find(mark => progress >= mark && !snapshotsTaken.current.includes(mark));

        if (nextSnapshotMark) {
            snapshotsTaken.current.push(nextSnapshotMark);
            setSnapshots(prev => [...prev, { elapsedTime: Math.round(newVirtualElapsedTime), carState: nextCarState, systemMetrics: nextSystemMetrics, scenario: nextScenario }]);
        }

        setVirtualElapsedTime(newVirtualElapsedTime);

        if (newVirtualElapsedTime >= virtualDuration) {
            handleStop(true);
        }
    }, [vehicleConfig, carState, systemMetrics, scenario, autoScenario, drivingStyle, alerts, virtualElapsedTime, virtualDuration, actualDuration, handleStop]);

    useEffect(() => {
        if (simulationState === SimulationState.Running) {
            simulationIntervalRef.current = window.setInterval(tick, SIMULATION_TICK_RATE_MS);
            realTimeIntervalRef.current = window.setInterval(() => setWallClockElapsedTime(p => p + 1), 1000);
        } else {
            if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
            if (realTimeIntervalRef.current) clearInterval(realTimeIntervalRef.current);
        }
        return () => {
            if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
            if (realTimeIntervalRef.current) clearInterval(realTimeIntervalRef.current);
        };
    }, [simulationState, tick]);
    
    const resetState = (newConfig: VehicleConfig) => {
        setCarState(getDefaultCarState());
        setSystemMetrics(getDefaultSystemMetrics(newConfig));
        setPowerDistribution(INITIAL_POWER_DISTRIBUTION);
        setAlerts([]);
        setHistory([]);
        setScenario(getDefaultScenario());
        setDrivingStyle(DrivingStyle.Normal);
        alertCountRef.current = { overload: 0, temp: 0 };
        setPowerTotals({} as Record<SubSystemName, number>);
        setPatternChangeEvents([]);
        setVirtualElapsedTime(0);
        setActualElapsedTime(0);
        setWallClockElapsedTime(0);
        setSnapshots([]);
        snapshotsTaken.current = [];
    }

    const handleStartRequest = () => {
        if (simulationState === SimulationState.Stopped) {
            setIsSetupModalOpen(true);
        } else {
             setSimulationState(SimulationState.Running);
        }
    };
    
    const handleFinalStart = ( newVehicleConfig: VehicleConfig, newScenario: Scenario, vDuration: number, aDuration: number) => {
        setVehicleConfig(newVehicleConfig);
        setScenario(newScenario);
        setVirtualDuration(vDuration);
        setActualDuration(aDuration);
        resetState(newVehicleConfig);
        initialConfigRef.current = { vehicle: newVehicleConfig, scenario: newScenario };
        startTimeRef.current = Date.now();
        setSimulationState(SimulationState.Running);
        setIsSetupModalOpen(false);
    };

    const handlePause = () => setSimulationState(SimulationState.Paused);

    const handleForcePatternChange = () => {
        if (simulationState !== SimulationState.Running || !autoScenario) return;
        setScenario(forceUpdateScenario());
        setPatternChangeEvents(prev => [...prev, Date.now()]);
    };
    
    const handleVehicleConfigChange = <K extends keyof VehicleConfig>(key: K, value: VehicleConfig[K]) => {
      const newConfig = {...vehicleConfig, [key]: value};
      if (key === 'carType') {
        newConfig.subType = CAR_SUBTYPES[value as CarType][0];
      }
      setVehicleConfig(newConfig);
      resetState(newConfig);
    }
    
     const handleScenarioChange = <K extends keyof Scenario>(key: K, value: Scenario[K]) => {
      setScenario(prevState => ({...prevState, [key]: value}));
    }
    
    const handleScenarioReset = (key: keyof Scenario) => {
      setScenario(prevState => ({...prevState, [key]: getDefaultScenario()[key]}));
    }

    return (
        <div className="h-screen bg-bg-primary text-text-primary font-sans flex flex-col">
            {isGeneratingReport && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-xl font-bold">Generating Report...</p>
                        <p className="text-text-secondary">Please wait, this may take a moment.</p>
                    </div>
                </div>
            )}
            <SummaryModal summary={summary} onClose={() => setSummary(null)} />
            <SetupModal 
                isOpen={isSetupModalOpen}
                onClose={() => setIsSetupModalOpen(false)}
                onStart={handleFinalStart}
                defaultVehicleConfig={getDefaultVehicleConfig()}
                defaultScenario={getDefaultScenario()}
            />
            <div className="flex-none px-4 sm:px-6 lg:px-8">
                <SimulationHeader
                    virtualElapsedTime={virtualElapsedTime}
                    virtualDuration={virtualDuration}
                    actualElapsedTime={actualElapsedTime}
                    actualDuration={actualDuration}
                    wallClockElapsedTime={wallClockElapsedTime}
                    simulationState={simulationState}
                />
            </div>
            <main className="flex-grow min-h-0 px-4 sm:px-6 lg:px-8 pb-4 flex flex-col gap-6">
                <div className="flex-grow min-h-0 flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-2/3 h-full">
                         <CarVisualization
                            powerDistribution={powerDistribution}
                            alerts={alerts}
                            metrics={systemMetrics}
                            activatedSystems={activatedSystems}
                            scenario={scenario}
                         />
                    </div>
                    <div className="lg:w-1/3 h-full flex flex-col gap-6 overflow-y-auto pr-2">
                       <ControlPanel
                          simulationState={simulationState}
                          onStart={handleStartRequest}
                          onPause={handlePause}
                          onStop={() => handleStop(false)}
                          vehicleConfig={vehicleConfig}
                          onVehicleConfigChange={handleVehicleConfigChange}
                          scenario={scenario}
                          onScenarioChange={handleScenarioChange}
                          onScenarioReset={handleScenarioReset}
                          autoScenario={autoScenario}
                          onAutoScenarioToggle={() => setAutoScenario(p => !p)}
                          drivingStyle={drivingStyle}
                          onDrivingStyleChange={setDrivingStyle}
                          onForcePatternChange={handleForcePatternChange}
                       />
                       <AlertLog alerts={alerts} />
                    </div>
                </div>
                <div className="flex-none">
                    <Dashboard metrics={systemMetrics} history={history} powerDistribution={powerDistribution} patternChangeEvents={patternChangeEvents} />
                </div>
            </main>
        </div>
    );
};

export default App;