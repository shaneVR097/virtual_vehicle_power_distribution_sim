import type { SubSystemConfig, PowerDistribution } from './types';

export const SUBSYSTEMS: SubSystemConfig[] = [
    // Engine Bay
    { id: 'ecu', name: 'ECU', category: 'Powertrain', priority: 5, basePower: 25, maxPower: 50, isConstant: true, x: '40%', y: '20%' },
    { id: 'fuelPump', name: 'Fuel Pump', category: 'Powertrain', priority: 5, basePower: 50, maxPower: 150, isConstant: false, x: '60%', y: '80%' },
    { id: 'radiatorFan', name: 'Radiator Fan', category: 'Powertrain', priority: 4, basePower: 0, maxPower: 400, isConstant: false, x: '25%', y: '20%' },
    { id: 'starterMotor', name: 'Starter', category: 'Powertrain', priority: 5, basePower: 0, maxPower: 1500, isConstant: false, x: '35%', y: '30%' },
    
    // Chassis & Safety
    { id: 'absModule', name: 'ABS', category: 'Chassis', priority: 5, basePower: 15, maxPower: 200, isConstant: true, x: '20%', y: '75%' },
    { id: 'powerSteering', name: 'Pwr Steering', category: 'Chassis', priority: 4, basePower: 20, maxPower: 800, isConstant: true, x: '25%', y: '60%' },
    { id: 'airbags', name: 'Airbags', category: 'Chassis', priority: 5, basePower: 5, maxPower: 10, isConstant: true, x: '50%', y: '50%' },

    // Exterior Lighting
    { id: 'headlights', name: 'Headlights', category: 'Lighting', priority: 3, basePower: 0, maxPower: 120, isConstant: false, x: '10%', y: '35%' },
    { id: 'tailLights', name: 'Tail Lights', category: 'Lighting', priority: 3, basePower: 0, maxPower: 20, isConstant: false, x: '90%', y: '35%' },
    { id: 'brakeLights', name: 'Brake Lights', category: 'Lighting', priority: 4, basePower: 0, maxPower: 40, isConstant: false, x: '90%', y: '50%' },
    { id: 'fogLights', name: 'Fog Lights', category: 'Lighting', priority: 2, basePower: 0, maxPower: 80, isConstant: false, x: '10%', y: '60%' },
    { id: 'daytimeRunningLights', name: 'DRL', category: 'Lighting', priority: 2, basePower: 15, maxPower: 40, isConstant: false, x: '12%', y: '25%' },

    // Climate Control
    { id: 'hvacBlower', name: 'HVAC Blower', category: 'Climate', priority: 2, basePower: 0, maxPower: 300, isConstant: false, x: '45%', y: '35%' },
    { id: 'hvacCompressor', name: 'AC Compressor', category: 'Climate', priority: 1, basePower: 0, maxPower: 1000, isConstant: false, x: '35%', y: '45%' },

    // Infotainment
    { id: 'infotainment', name: 'Infotainment', category: 'Infotainment', priority: 2, basePower: 20, maxPower: 80, isConstant: true, x: '50%', y: '60%' },
    { id: 'audioSystem', name: 'Audio System', category: 'Infotainment', priority: 1, basePower: 10, maxPower: 400, isConstant: false, x: '60%', y: '65%' },
    { id: 'speakers', name: 'Speakers', category: 'Infotainment', priority: 1, basePower: 0, maxPower: 100, isConstant: false, x: '75%', y: '60%' },

    // Interior
    { id: 'domeLight', name: 'Dome Light', category: 'Interior', priority: 1, basePower: 5, maxPower: 15, isConstant: false, x: '50%', y: '40%' },
    { id: 'instrumentCluster', name: 'Instrument Cluster', category: 'Interior', priority: 4, basePower: 15, maxPower: 50, isConstant: true, x: '38%', y: '55%' },
    { id: 'windowMotors', name: 'Window Motors', category: 'Interior', priority: 1, basePower: 0, maxPower: 150, isConstant: false, x: '30%', y: '70%' },
    { id: 'seatHeaters', name: 'Seat Heaters', category: 'Interior', priority: 1, basePower: 0, maxPower: 200, isConstant: false, x: '65%', y: '50%' },
    { id: 'wipers', name: 'Wipers', category: 'Interior', priority: 3, basePower: 0, maxPower: 150, isConstant: false, x: '25%', y: '45%' },
];

export const INITIAL_POWER_DISTRIBUTION: PowerDistribution = SUBSYSTEMS.reduce((acc, system) => {
    acc[system.id] = 0;
    return acc;
}, {} as PowerDistribution);


export const SIMULATION_TICK_RATE_MS = 1500;