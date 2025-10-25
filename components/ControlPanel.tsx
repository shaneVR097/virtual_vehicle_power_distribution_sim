import React, { useState, useEffect, useRef } from 'react';
import type { VehicleConfig, Scenario } from '../types';
import { DrivingStyle, SimulationState, CarType, Powertrain, VoltageSystem, TimeOfDay, Weather, Region, CAR_SUBTYPES, TrafficDensity, RoadCondition, Terrain } from '../types';
import { PlayIcon, PauseIcon, StopIcon, ResetIcon } from './Icons';

interface ControlPanelProps {
  simulationState: SimulationState;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  vehicleConfig: VehicleConfig;
  onVehicleConfigChange: <K extends keyof VehicleConfig>(key: K, value: VehicleConfig[K]) => void;
  scenario: Scenario;
  onScenarioChange: <K extends keyof Scenario>(key: K, value: Scenario[K]) => void;
  onScenarioReset: (key: keyof Scenario) => void;
  autoScenario: boolean;
  onAutoScenarioToggle: () => void;
  drivingStyle: DrivingStyle;
  onDrivingStyleChange: (style: DrivingStyle) => void;
  onForcePatternChange: () => void;
}

const ControlButton: React.FC<{ onClick: () => void, disabled?: boolean, children: React.ReactNode, className: string }> = ({ onClick, disabled, children, className }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-lg flex items-center justify-center font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

const CustomSelect: React.FC<{label: string, value: string, onChange: (value: any) => void, disabled: boolean, options: readonly string[]}> = ({label, value, onChange, disabled, options}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-md py-2 px-3 text-left text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex justify-between items-center"
            >
                {value}
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="absolute z-10 top-full mt-1 w-full glass-pane p-1 max-h-40 overflow-y-auto">
                    {options.map(opt => (
                        <div
                            key={opt}
                            onClick={() => { onChange(opt); setIsOpen(false); }}
                            className="px-3 py-1.5 text-sm text-text-primary rounded-md hover:bg-indigo-600/50 cursor-pointer"
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const DrivingStyleJoystick: React.FC<{ onChange: (style: DrivingStyle) => void }> = ({ onChange }) => {
    const [pos, setPos] = useState({ x: 50, y: 50 });
    const padRef = useRef<HTMLDivElement>(null);

    const handleInteraction = (clientX: number, clientY: number) => {
        if (!padRef.current) return;
        const rect = padRef.current.getBoundingClientRect();
        const size = rect.width;
        const half = size / 2;
        let x = clientX - rect.left;
        let y = clientY - rect.top;

        const dx = x - half;
        const dy = y - half;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > half) {
            x = half + (dx/dist) * half;
            y = half + (dy/dist) * half;
        }
        
        setPos({ x: (x / size) * 100, y: (y / size) * 100 });

        const styleValue = 1 - (y / size); // 0 at bottom, 1 at top
        let style: DrivingStyle;
        if (styleValue > 0.8) style = DrivingStyle.Aggressive;
        else if (styleValue > 0.6) style = DrivingStyle.Sport;
        else if (styleValue > 0.4) style = DrivingStyle.Normal;
        else if (styleValue > 0.2) style = DrivingStyle.Comfort;
        else style = DrivingStyle.Eco;
        onChange(style);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const onMouseMove = (moveEvent: MouseEvent) => handleInteraction(moveEvent.clientX, moveEvent.clientY);
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        handleInteraction(e.clientX, e.clientY);
    };

    return (
        <div className="flex flex-col items-center">
            <div
                ref={padRef}
                className="w-32 h-32 rounded-full cursor-pointer relative bg-gradient-to-t from-green-500 via-yellow-500 to-red-500"
                onMouseDown={handleMouseDown}
            >
                <div 
                    className="absolute w-6 h-6 rounded-full bg-white/80 border-2 border-black/50 shadow-lg -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                />
            </div>
            <div className="text-center mt-2">
                <p className="text-xs text-text-secondary">Driving Style</p>
                <p className="font-bold text-sm text-accent-blue">{Object.values(DrivingStyle)[Math.floor((1 - pos.y/100) * 4.99)]}</p>
            </div>
        </div>
    );
};


const ControlPanel: React.FC<ControlPanelProps> = (props) => {
    const {
      simulationState, onStart, onPause, onStop,
      vehicleConfig, onVehicleConfigChange,
      scenario, onScenarioChange, onScenarioReset,
      autoScenario, onAutoScenarioToggle,
      drivingStyle, onDrivingStyleChange,
      onForcePatternChange
    } = props;
    const isRunning = simulationState === SimulationState.Running;
    const isStopped = simulationState === SimulationState.Stopped;

    useEffect(() => {
        const validSubTypes = CAR_SUBTYPES[vehicleConfig.carType];
        if (!validSubTypes.includes(vehicleConfig.subType)) {
            onVehicleConfigChange('subType', validSubTypes[0]);
        }
    }, [vehicleConfig.carType]);

  return (
    <div className="glass-pane p-4 flex flex-col h-full">
      <h2 className="text-xl font-bold text-text-primary mb-4 px-1">Controls</h2>
      <div className="flex-grow overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Simulation */}
        <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-bold text-text-primary border-b border-border-primary pb-1">Simulation</h3>
            <ControlButton onClick={onStart} disabled={isRunning} className="bg-green-600 hover:bg-green-500 focus:ring-green-500"><PlayIcon className="h-5 w-5 mr-2" /> Start</ControlButton>
            <ControlButton onClick={onPause} disabled={!isRunning} className="bg-yellow-600 hover:bg-yellow-500 focus:ring-yellow-500"><PauseIcon className="h-5 w-5 mr-2" /> Pause</ControlButton>
            <ControlButton onClick={onStop} disabled={isStopped} className="bg-red-600 hover:bg-red-500 focus:ring-red-500"><StopIcon className="h-5 w-5 mr-2" /> Stop</ControlButton>
        </div>

        {/* Column 2: Vehicle */}
        <div className="flex flex-col space-y-3">
             <h3 className="text-lg font-bold text-text-primary border-b border-border-primary pb-1">Vehicle</h3>
             <CustomSelect label="Car Type" value={vehicleConfig.carType} onChange={(v) => onVehicleConfigChange('carType', v as CarType)} disabled={!isStopped} options={Object.values(CarType)} />
             <CustomSelect label="Sub-Type" value={vehicleConfig.subType} onChange={(v) => onVehicleConfigChange('subType', v)} disabled={!isStopped} options={CAR_SUBTYPES[vehicleConfig.carType]} />
             <CustomSelect label="Powertrain" value={vehicleConfig.powertrain} onChange={(v) => onVehicleConfigChange('powertrain', v as Powertrain)} disabled={!isStopped} options={Object.values(Powertrain)} />
             <CustomSelect label="Voltage" value={vehicleConfig.voltageSystem} onChange={(v) => onVehicleConfigChange('voltageSystem', v as VoltageSystem)} disabled={!isStopped} options={Object.values(VoltageSystem)} />
        </div>

        {/* Column 3: Scenario */}
        <div className="flex flex-col space-y-3">
            <div className="flex justify-between items-center border-b border-border-primary pb-1">
                <h3 className="text-lg font-bold text-text-primary">Scenario</h3>
                <div className="flex items-center space-x-2">
                    <span className={`text-xs font-semibold ${autoScenario ? 'text-accent-blue' : 'text-text-secondary'}`}>AUTO</span>
                    <button onClick={onAutoScenarioToggle} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${autoScenario ? 'bg-indigo-600' : 'bg-gray-600'}`}>
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${autoScenario ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>
            
            {autoScenario ? (
                <div className="flex-grow flex flex-col items-center justify-center space-y-4">
                   <DrivingStyleJoystick onChange={onDrivingStyleChange} />
                   <button onClick={onForcePatternChange} className="w-full text-sm py-2 bg-purple-600 hover:bg-purple-500 rounded-md font-semibold transition-colors">Change Pattern</button>
                </div>
            ) : (
                <>
                <CustomSelect label="Time of Day" value={scenario.timeOfDay} onChange={(v) => onScenarioChange('timeOfDay', v as TimeOfDay)} disabled={autoScenario} options={Object.values(TimeOfDay)} />
                <CustomSelect label="Weather" value={scenario.weather} onChange={(v) => onScenarioChange('weather', v as Weather)} disabled={autoScenario} options={Object.values(Weather)} />
                <CustomSelect label="Region" value={scenario.region} onChange={(v) => onScenarioChange('region', v as Region)} disabled={autoScenario} options={Object.values(Region)} />
                <CustomSelect label="Terrain" value={scenario.terrain} onChange={(v) => onScenarioChange('terrain', v as Terrain)} disabled={autoScenario} options={Object.values(Terrain)} />
                </>
            )}
        </div>

      </div>
    </div>
  );
};

export default ControlPanel;