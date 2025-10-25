
export enum CarType {
    Sedan = 'Sedan',
    SUV = 'SUV',
    Hatchback = 'Hatchback',
    Pickup = 'Pickup',
    Coupe = 'Coupe',
    Convertible = 'Convertible',
    Minivan = 'Minivan',
    Bus = 'Bus',
    Truck = 'Truck',
    Special = 'Special',
}

export const CAR_SUBTYPES: Record<CarType, string[]> = {
    [CarType.Sedan]: ['Compact', 'Mid-Size', 'Full-Size'],
    [CarType.SUV]: ['Compact', 'Mid-Size', 'Full-Size'],
    [CarType.Hatchback]: ['Subcompact', 'Compact'],
    [CarType.Pickup]: ['Light-Duty', 'Heavy-Duty'],
    [CarType.Coupe]: ['Sports', 'Grand Tourer'],
    [CarType.Convertible]: ['Roadster', '4-Seater'],
    [CarType.Minivan]: ['Standard', 'Extended Wheelbase'],
    [CarType.Bus]: ['City', 'Long-Distance', 'Electric'],
    [CarType.Truck]: ['Light', 'Heavy', 'Semi', 'Electric'],
    [CarType.Special]: ['Emergency', 'Construction', 'Agricultural'],
};


export enum Powertrain {
    ICE = 'ICE',
    EV = 'EV',
    Hybrid = 'Hybrid',
    FCEV = 'FCEV',
    CNG = 'CNG',
    LPG = 'LPG',
    FlexFuel = 'Flex-Fuel',
}

export enum VoltageSystem {
    '12V' = '12V',
    '48V' = '48V',
}

export interface VehicleConfig {
    carType: CarType;
    subType: string;
    powertrain: Powertrain;
    voltageSystem: VoltageSystem;
}

// FIX: Moved BatteryParameters interface here from constants.ts
export interface BatteryParameters {
    capacityWh: number;
    nominalVoltage: number;
    internalResistanceOhms: number;
    // For thermal model
    massKg: number;
    specificHeatCapacity: number; // J/(kg*C)
}

export enum TimeOfDay {
    Day = 'Day',
    Dusk = 'Dusk',
    Night = 'Night',
}

export enum Weather {
    Sunny = 'Sunny',
    Cloudy = 'Cloudy',
    Rainy = 'Rainy',
    Snowy = 'Snowy',
}

export enum Region {
    City = 'City',
    Suburban = 'Suburban',
    Highway = 'Highway',
    Offroad = 'Off-road',
}

export enum TrafficDensity {
    Light = 'Light',
    Medium = 'Medium',
    Heavy = 'Heavy',
}

export enum RoadCondition {
    Dry = 'Dry',
    Wet = 'Wet',
    Icy = 'Icy',
}

export enum Terrain {
    Flat = 'Flat',
    Uphill = 'Uphill',
    Downhill = 'Downhill',
}

export interface Scenario {
    timeOfDay: TimeOfDay;
    weather: Weather;
    region: Region;
    traffic: TrafficDensity;
    roadCondition: RoadCondition;
    outsideTemp: number; // Celsius
    terrain: Terrain;
}

export enum SimulationState {
    Stopped = 'STOPPED',
    Running = 'RUNNING',
    Paused = 'PAUSED',
}

export enum CarAction {
    Idle = 'Idle',
    Accelerating = 'Accelerating',
    Braking = 'Braking',
    Cruising = 'Cruising',
    Turning = 'Turning',
}

export enum DrivingStyle {
    Eco = 'Eco',
    Comfort = 'Comfort',
    Normal = 'Normal',
    Sport = 'Sport',
    Aggressive = 'Aggressive',
}

export interface CarState {
    speed: number;
    action: CarAction;
    hvacOn: boolean;
    lightsOn: boolean;
    wipersOn: boolean;
    seatHeatersOn: boolean;
    isIgnitionCycle: boolean;
}

export interface SystemMetrics {
    batteryCharge: number; // Percentage (SoC)
    batterySoh: number; // Percentage (State of Health)
    batteryVoltage: number; // Volts
    batteryCurrent: number; // Amperes
    systemTemp: number; // Celsius
    totalPowerDraw: number; // Watts
    availablePower: number; // Watts
}

export type SubSystemName =
  | 'ecu' | 'fuelPump' | 'radiatorFan' | 'starterMotor' | 'tractionMotor'
  | 'absModule' | 'powerSteering' | 'airbags'
  | 'headlights' | 'tailLights' | 'brakeLights' | 'fogLights' | 'daytimeRunningLights'
  | 'hvacBlower' | 'hvacCompressor'
  | 'infotainment' | 'audioSystem'
  | 'domeLight' | 'instrumentCluster'
  | 'windowMotors' | 'seatHeaters' | 'wipers' | 'speakers'
  // New subsystems for expanded vehicle types
  | 'airBrakeCompressor' | 'siren' | 'strobeLights';

export type PowerDistribution = Record<SubSystemName, number>;

export interface Alert {
    id: string;
    subsystem: SubSystemName | 'system';
    message: string;
    timestamp: number;
}

export interface HistoryEntry {
    timestamp: number;
    totalPowerDraw: number;
    batteryCharge: number;
    systemTemp: number;
    hvacCompressor: number;
    radiatorFan: number;
    powerSteering: number;
}

export interface SubSystemConfig {
    id: SubSystemName;
    name: string;
    category: 'Powertrain' | 'Chassis' | 'Lighting' | 'Climate' | 'Interior' | 'Infotainment' | 'Special';
    priority: number;
    basePower: number;
    maxPower: number;
    isConstant: boolean;
    x: string;
    y: string;
}

export interface SimulationSnapshot {
    elapsedTime: number; // in seconds
    carState: CarState;
    systemMetrics: SystemMetrics;
    scenario: Scenario;
}

export interface SimulationSummary {
    duration: number; // seconds
    avgPowerDraw: number;
    peakPowerDraw: number;
    overloadEvents: number;
    tempWarnings: number;
    finalBattery: number;
    vehicleConfig: VehicleConfig;
    scenario: Scenario;
    history: HistoryEntry[];
    powerTotals: Record<SubSystemName, number>;
}