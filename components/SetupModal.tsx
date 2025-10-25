import React, { useState, useEffect } from 'react';
import type { VehicleConfig, Scenario } from '../types';
import { CarType, Powertrain, VoltageSystem, TimeOfDay, Weather, Region, CAR_SUBTYPES, Terrain } from '../types';

interface SetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (vehicleConfig: VehicleConfig, scenario: Scenario, virtualDuration: number, actualDuration: number) => void;
    defaultVehicleConfig: VehicleConfig;
    defaultScenario: Scenario;
}

const CustomSelect: React.FC<{label: string, value: string, onChange: (value: any) => void, onOpen: () => void, options: readonly string[]}> = ({label, value, onChange, onOpen, options}) => (
    <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            onClick={onOpen}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const TimeInput: React.FC<{ label: string; value: number; onChange: (seconds: number) => void; onFocus: () => void }> = ({ label, value, onChange, onFocus }) => {
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const seconds = value % 60;

    const handleChange = (part: 'h' | 'm' | 's', valStr: string) => {
        let val = parseInt(valStr, 10) || 0;
        let newSeconds = 0;
        if (part === 'h') {
            newSeconds = Math.max(0, val) * 3600 + minutes * 60 + seconds;
        } else if (part === 'm') {
            val = Math.max(0, Math.min(59, val));
            newSeconds = hours * 3600 + val * 60 + seconds;
        } else { // 's'
            val = Math.max(0, Math.min(59, val));
            newSeconds = hours * 3600 + minutes * 60 + val;
        }
        onChange(newSeconds);
    };
    
    const inputClass = "w-full bg-gray-800/70 border border-gray-600 rounded-md py-2 px-3 text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500";

    return (
        <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
            <div className="flex gap-2 items-center" onFocus={onFocus}>
                <input type="number" value={String(hours).padStart(2, '0')} onChange={e => handleChange('h', e.target.value)} className={inputClass} placeholder="hh" />
                <span className="font-bold">:</span>
                <input type="number" value={String(minutes).padStart(2, '0')} onChange={e => handleChange('m', e.target.value)} className={inputClass} placeholder="mm" />
                <span className="font-bold">:</span>
                <input type="number" value={String(seconds).padStart(2, '0')} onChange={e => handleChange('s', e.target.value)} className={inputClass} placeholder="ss" />
            </div>
        </div>
    );
};


const SetupModal: React.FC<SetupModalProps> = ({ isOpen, onClose, onStart, defaultVehicleConfig, defaultScenario }) => {
    const [vehicleConfig, setVehicleConfig] = useState(defaultVehicleConfig);
    const [scenario, setScenario] = useState(defaultScenario);
    const [virtualDuration, setVirtualDuration] = useState(300);
    const [actualDuration, setActualDuration] = useState(3600);
    const [touched, setTouched] = useState({ vehicle: false, scenario: false });

    useEffect(() => {
        if (isOpen) {
            setVehicleConfig(defaultVehicleConfig);
            setScenario(defaultScenario);
            setVirtualDuration(300);
            setActualDuration(3600);
            setTouched({ vehicle: false, scenario: false });
        }
    }, [isOpen, defaultVehicleConfig, defaultScenario]);
    
    useEffect(() => {
        const validSubTypes = CAR_SUBTYPES[vehicleConfig.carType];
        if (!validSubTypes.includes(vehicleConfig.subType)) {
            setVehicleConfig(vc => ({ ...vc, subType: validSubTypes[0] }));
        }
    }, [vehicleConfig.carType]);

    if (!isOpen) return null;

    const isReady = Object.values(touched).every(t => t);
    const isDirty = JSON.stringify(vehicleConfig) !== JSON.stringify(defaultVehicleConfig) || JSON.stringify(scenario) !== JSON.stringify(defaultScenario) || virtualDuration !== 300 || actualDuration !== 3600;
    
    const handleVehicleChange = <K extends keyof VehicleConfig>(key: K, value: VehicleConfig[K]) => {
        setVehicleConfig(vc => ({ ...vc, [key]: value }));
    }

    const handleScenarioChange = <K extends keyof Scenario>(key: K, value: Scenario[K]) => {
        setScenario(s => ({ ...s, [key]: value }));
    }

    const buttonColor = !isReady ? 'bg-gray-500' : isDirty ? 'bg-orange-600 hover:bg-orange-500' : 'bg-green-600 hover:bg-green-500';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="glass-pane p-6 rounded-lg max-w-3xl w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-3xl font-bold text-white mb-4">Simulation Setup</h2>
                <p className="text-text-secondary mb-6">Configure the vehicle and environment before starting the simulation.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vehicle Config */}
                    <div className="space-y-4 glass-pane p-4" onFocus={() => setTouched(t => ({...t, vehicle: true}))} tabIndex={-1}>
                        <h3 className="text-xl font-bold text-accent-blue">Vehicle</h3>
                        <CustomSelect label="Car Type" value={vehicleConfig.carType} onChange={v => handleVehicleChange('carType', v)} onOpen={() => setTouched(t => ({...t, vehicle: true}))} options={Object.values(CarType)} />
                        <CustomSelect label="Sub-Type" value={vehicleConfig.subType} onChange={v => handleVehicleChange('subType', v)} onOpen={() => setTouched(t => ({...t, vehicle: true}))} options={CAR_SUBTYPES[vehicleConfig.carType]} />
                        <CustomSelect label="Powertrain" value={vehicleConfig.powertrain} onChange={v => handleVehicleChange('powertrain', v)} onOpen={() => setTouched(t => ({...t, vehicle: true}))} options={Object.values(Powertrain)} />
                        <CustomSelect label="Voltage" value={vehicleConfig.voltageSystem} onChange={v => handleVehicleChange('voltageSystem', v)} onOpen={() => setTouched(t => ({...t, vehicle: true}))} options={Object.values(VoltageSystem)} />
                    </div>
                    {/* Scenario Config */}
                     <div className="space-y-4 glass-pane p-4" onFocus={() => setTouched(t => ({...t, scenario: true}))} tabIndex={-1}>
                        <h3 className="text-xl font-bold text-accent-blue">Environment & Time</h3>
                        <CustomSelect label="Time of Day" value={scenario.timeOfDay} onChange={v => handleScenarioChange('timeOfDay', v)} onOpen={() => setTouched(t => ({...t, scenario: true}))} options={Object.values(TimeOfDay)} />
                        <CustomSelect label="Weather" value={scenario.weather} onChange={v => handleScenarioChange('weather', v)} onOpen={() => setTouched(t => ({...t, scenario: true}))} options={Object.values(Weather)} />
                        <CustomSelect label="Region" value={scenario.region} onChange={v => handleScenarioChange('region', v)} onOpen={() => setTouched(t => ({...t, scenario: true}))} options={Object.values(Region)} />
                        <CustomSelect label="Terrain" value={scenario.terrain} onChange={v => handleScenarioChange('terrain', v)} onOpen={() => setTouched(t => ({...t, scenario: true}))} options={Object.values(Terrain)} />
                         <TimeInput label="Virtual Duration (Wall time)" value={virtualDuration} onChange={setVirtualDuration} onFocus={() => setTouched(t => ({...t, scenario: true}))} />
                         <TimeInput label="Actual Duration (Simulated)" value={actualDuration} onChange={setActualDuration} onFocus={() => setTouched(t => ({...t, scenario: true}))} />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-4">
                    <button onClick={onClose} className="py-2 px-6 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors">Cancel</button>
                    <button 
                        onClick={() => onStart(vehicleConfig, scenario, virtualDuration, actualDuration)} 
                        disabled={!isReady || virtualDuration <= 0}
                        className={`py-2 px-6 rounded-md font-semibold transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed ${buttonColor}`}
                        title={virtualDuration <= 0 ? "Virtual duration must be greater than 0" : ""}
                    >
                        {isReady && isDirty ? 'Start with Changes' : isReady ? 'Start Simulation' : 'Review Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetupModal;
