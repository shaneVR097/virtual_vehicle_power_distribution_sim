import React, { useState, useEffect } from 'react';
import type { PowerDistribution, Alert, SubSystemName, SystemMetrics, SubSystemConfig, Scenario } from '../types';
import { TimeOfDay, Weather, Region, Terrain } from '../types';
import { SUBSYSTEMS } from '../constants';
import StatCard from './StatCard';
import { 
    ZapIcon, SnowflakeIcon, LightbulbIcon, RadioIcon, AlertTriangleIcon, 
    ThermometerIcon, CpuIcon, FanIcon, SpeakerIcon,
    WindshieldWiperIcon, SeatHeaterIcon, WindowMotorIcon, ClusterIcon,
    SunIcon, MoonIcon, SunsetIcon, CloudIcon, CloudRainIcon, BuildingIcon, HomeIcon, RoadIcon, MountainIcon, MinusIcon, TrendingUpIcon, TrendingDownIcon,
    PowerIcon, BatteryChargingIcon,
    SirenIcon, AirBrakeIcon, MotorIcon, HealthIcon
} from './Icons';

interface CarVisualizationProps {
    powerDistribution: PowerDistribution;
    alerts: Alert[];
    metrics: SystemMetrics;
    activatedSystems: SubSystemName[];
    scenario: Scenario;
}

const subsystemIcons: Record<SubSystemName, React.ReactNode> = {
    ecu: <CpuIcon className="w-5 h-5" />,
    fuelPump: <div className="font-bold text-xs">FUEL</div>,
    radiatorFan: <FanIcon className="w-5 h-5" />,
    starterMotor: <ZapIcon className="w-5 h-5" />,
    tractionMotor: <MotorIcon className="w-6 h-6" />,
    absModule: <div className="font-bold text-xs">ABS</div>,
    powerSteering: <div className="font-bold text-xs">EPS</div>,
    airbags: <AlertTriangleIcon className="w-5 h-5" />,
    headlights: <LightbulbIcon className="w-5 h-5" />,
    tailLights: <LightbulbIcon className="w-5 h-5" />,
    brakeLights: <LightbulbIcon className="w-5 h-5 text-red-400" />,
    fogLights: <LightbulbIcon className="w-5 h-5" />,
    daytimeRunningLights: <LightbulbIcon className="w-5 h-5" />,
    hvacBlower: <FanIcon className="w-5 h-5" />,
    hvacCompressor: <SnowflakeIcon className="w-5 h-5" />,
    infotainment: <RadioIcon className="w-5 h-5" />,
    audioSystem: <SpeakerIcon className="w-5 h-5" />,
    speakers: <SpeakerIcon className="w-5 h-5" />,
    domeLight: <LightbulbIcon className="w-4 h-4 opacity-70" />,
    instrumentCluster: <ClusterIcon className="w-5 h-5" />,
    windowMotors: <WindowMotorIcon className="w-5 h-5" />,
    seatHeaters: <SeatHeaterIcon className="w-5 h-5" />,
    wipers: <WindshieldWiperIcon className="w-5 h-5" />,
    airBrakeCompressor: <AirBrakeIcon className="w-5 h-5" />,
    siren: <SirenIcon className="w-5 h-5" />,
    strobeLights: <LightbulbIcon className="w-5 h-5 text-blue-400 animate-pulse" />,
};

const SubSystemNode: React.FC<{ subsystem: SubSystemConfig, power: number, hasAlert: boolean }> = ({ subsystem, power, hasAlert }) => {
    const powerRatio = subsystem.maxPower > 0 ? Math.min(1, power / subsystem.maxPower) : 0;
    const glowIntensity = power > 1 ? powerRatio : 0;
    
    let glowColor = 'rgba(74, 222, 128, 0.6)'; // green
    if (powerRatio > 0.75) glowColor = 'rgba(248, 113, 113, 0.6)'; // red
    else if (powerRatio > 0.4) glowColor = 'rgba(251, 191, 36, 0.6)'; // yellow

    const glowStyle = {
        boxShadow: `0 0 ${glowIntensity * 15}px ${glowIntensity * 5}px ${glowColor}`,
    } as React.CSSProperties;

    const alertColor = hasAlert ? 'border-red-500 bg-red-900/50 text-red-300' : 'border-gray-600 bg-gray-800/80';
    
    return (
        <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center transition-all duration-500 group"
            style={{ left: subsystem.x, top: subsystem.y }}
            id={`node-${subsystem.id}`}
        >
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 relative ${alertColor}`}
              style={glowStyle}
            >
                <div className={`transition-opacity duration-300 ${power > 1 ? 'opacity-100' : 'opacity-50'}`}>
                    {subsystemIcons[subsystem.id]}
                </div>
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-bg-secondary ${subsystem.isConstant ? 'bg-sky-400' : 'bg-violet-400'}`} title={subsystem.isConstant ? 'Constant Load' : 'Variable Load'}></div>
            </div>
            <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-900/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
              <p className="font-bold">{subsystem.name}</p>
              <p>{power.toFixed(0)}W</p>
            </div>
        </div>
    );
};

const ActiveLoadBoard: React.FC<{ title: string, systems: SubSystemConfig[], powerDistribution: PowerDistribution }> = ({ title, systems, powerDistribution }) => {
    const activeSystems = systems.filter(s => powerDistribution[s.id] > 0);

    return (
        <div className="glass-pane p-2 rounded-md h-full flex flex-col pointer-events-auto">
            <h4 className="text-xs font-bold text-center text-text-secondary border-b border-border-primary pb-1 mb-1 flex-none">{title}</h4>
            <div className="space-y-1 overflow-y-auto flex-grow pr-1">
                {activeSystems.length > 0 ? activeSystems.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs bg-gray-900/50 p-1 rounded">
                        <div className="flex items-center gap-1.5 min-w-0">
                           <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-sky-300">{subsystemIcons[s.id]}</div>
                           <span className="text-text-primary truncate">{s.name}</span>
                        </div>
                        <span className="font-mono text-text-secondary flex-shrink-0">{powerDistribution[s.id].toFixed(0)}W</span>
                    </div>
                )) : <p className="text-xs text-center text-gray-500 italic pt-2">--</p>}
            </div>
        </div>
    )
};

const ScenarioDisplay: React.FC<{ scenario: Scenario }> = ({ scenario }) => {
    const timeIcon = { [TimeOfDay.Day]: <SunIcon />, [TimeOfDay.Dusk]: <SunsetIcon />, [TimeOfDay.Night]: <MoonIcon /> }[scenario.timeOfDay];
    const weatherIcon = { [Weather.Sunny]: <SunIcon className="text-yellow-400"/>, [Weather.Cloudy]: <CloudIcon />, [Weather.Rainy]: <CloudRainIcon />, [Weather.Snowy]: <SnowflakeIcon /> }[scenario.weather];
    const regionIcon = { [Region.City]: <BuildingIcon />, [Region.Suburban]: <HomeIcon />, [Region.Highway]: <RoadIcon />, [Region.Offroad]: <MountainIcon /> }[scenario.region];
    const terrainIcon = { [Terrain.Flat]: <MinusIcon />, [Terrain.Uphill]: <TrendingUpIcon />, [Terrain.Downhill]: <TrendingDownIcon /> }[scenario.terrain];

    const ScenarioItem: React.FC<{icon: React.ReactNode, label: string}> = ({ icon, label }) => (
        <div className="flex items-center gap-2 text-sm">
            <div className="w-5 h-5 flex items-center justify-center text-accent-blue">{icon}</div>
            <span className="text-text-primary font-medium">{label}</span>
        </div>
    );

    return (
        <div className="absolute top-4 right-4 z-20 glass-pane p-3 flex flex-col space-y-2 pointer-events-auto">
            <ScenarioItem icon={timeIcon} label={scenario.timeOfDay} />
            <ScenarioItem icon={weatherIcon} label={scenario.weather} />
            <ScenarioItem icon={regionIcon} label={scenario.region} />
            <ScenarioItem icon={terrainIcon} label={scenario.terrain} />
        </div>
    );
};

interface ActivationNotice {
    id: string;
    name: string;
}

const CarVisualization: React.FC<CarVisualizationProps> = ({ powerDistribution, alerts, metrics, activatedSystems, scenario }) => {
    const [notices, setNotices] = useState<ActivationNotice[]>([]);

    useEffect(() => {
        if (activatedSystems.length > 0) {
            const newNotices: ActivationNotice[] = activatedSystems.map((systemId) => {
                const subsystem = SUBSYSTEMS.find(s => s.id === systemId);
                return {
                    id: `${systemId}-${Date.now()}`,
                    name: subsystem ? `${subsystem.name} ON` : 'System ON',
                };
            });
            setNotices(prev => [...prev.slice(-4), ...newNotices]);

            newNotices.forEach(notice => {
                setTimeout(() => {
                    setNotices(prev => prev.filter(n => n.id !== notice.id));
                }, 2500);
            });
        }
    }, [activatedSystems]);

    const constantLoads = SUBSYSTEMS.filter(s => s.isConstant);
    const variableLoads = SUBSYSTEMS.filter(s => !s.isConstant);

    return (
        <div className="w-full h-full glass-pane p-2 sm:p-4 relative shadow-inner overflow-hidden flex flex-col">
            <style>
                {`
                @keyframes flow { to { stroke-dashoffset: -8; } }
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateY(10px); }
                    20% { opacity: 1; transform: translateY(0); }
                    80% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-10px); }
                }
                .activation-notice {
                    animation: fadeInOut 2.5s ease-in-out forwards;
                }
                `}
            </style>
             <div className="absolute top-4 left-4 z-20 space-y-2">
                {notices.map((notice) => (
                    <div key={notice.id} className="activation-notice glass-pane px-3 py-1 text-sm font-semibold text-sky-300">
                        {notice.name}
                    </div>
                ))}
            </div>
            
            <ScenarioDisplay scenario={scenario} />
            
            <div className="relative flex-grow w-full h-full">
                {/* Car Outline Background */}
                <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full text-gray-700/60 opacity-75" preserveAspectRatio="xMidYMid meet">
                    <path d="M750 250 H790 V200 H750 V180 C750 160, 720 150, 700 150 H600 L550 100 H250 L200 150 H100 C80 150, 50 160, 50 180 V250 H10 V300 H50 V280 C50 260, 80 250, 100 250 H700 C720 250, 750 260, 750 280 V300 H790 V250 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="150" cy="250" r="40" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="650" cy="250" r="40" fill="none" stroke="currentColor" strokeWidth="2"/>
                </svg>
                
                <div className="relative w-full h-full">
                    {/* Central Power Node */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-16 h-16 rounded-full bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center">
                            <ZapIcon className="w-8 h-8 text-yellow-300" />
                        </div>
                    </div>

                    {SUBSYSTEMS.map(subsystem => {
                        const hasAlert = alerts.some(a => a.subsystem === subsystem.id);
                        return (
                            <SubSystemNode
                                key={subsystem.id}
                                subsystem={subsystem}
                                power={powerDistribution[subsystem.id]}
                                hasAlert={hasAlert}
                            />
                        );
                    })}
                </div>

                {/* Bottom Info Bar as HUD */}
                <div className="absolute bottom-0 left-0 right-0 p-1 pointer-events-none">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
                         <StatCard icon={<PowerIcon className="h-5 w-5 text-white" />} title="Total Power" value={metrics.totalPowerDraw.toFixed(0)} unit="W" colorClass="bg-sky-500" />
                         <StatCard icon={<BatteryChargingIcon className="h-5 w-5 text-white" />} title="SoC" value={metrics.batteryCharge.toFixed(1)} unit="%" colorClass="bg-green-500" />
                         <StatCard icon={<HealthIcon className="h-5 w-5 text-white" />} title="SoH" value={metrics.batterySoh.toFixed(2)} unit="%" colorClass="bg-pink-500" />
                         <StatCard icon={<ZapIcon className="h-5 w-5 text-white" />} title="Voltage" value={metrics.batteryVoltage.toFixed(1)} unit="V" colorClass="bg-yellow-500" />
                         <StatCard icon={<ZapIcon className="h-5 w-5 text-white" />} title="Current" value={metrics.batteryCurrent.toFixed(1)} unit="A" colorClass="bg-orange-500" />
                         <StatCard icon={<ThermometerIcon className="h-5 w-5 text-white" />} title="Sys Temp" value={metrics.systemTemp.toFixed(1)} unit="°C" colorClass="bg-red-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                        <div className="h-24"><ActiveLoadBoard title="Active Constant Loads" systems={constantLoads} powerDistribution={powerDistribution} /></div>
                        <div className="h-24"><ActiveLoadBoard title="Active Variable Loads" systems={variableLoads} powerDistribution={powerDistribution} /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarVisualization;
