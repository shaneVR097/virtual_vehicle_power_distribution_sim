import type { VehicleConfig, CarState, SystemMetrics, Scenario, SubSystemConfig, PowerDistribution, SubSystemName, CarType } from '../types';
import { CarAction, RoadCondition, Terrain, TimeOfDay, Weather } from '../types';
import { getVehiclePowerCalculator } from './vehicleBehaviorService';
import type { PowerCalculationResult } from '../vehicle/behaviorTypes';

// --- Main Calculation Dispatcher ---

export function calculateDemandAndCharge(
    vehicleConfig: VehicleConfig,
    carState: CarState,
    systemMetrics: SystemMetrics,
    scenario: Scenario,
    subsystems: SubSystemConfig[]
): PowerCalculationResult {
    
    // 1. Get the specific power calculation logic for the configured vehicle.
    const powerCalculator = getVehiclePowerCalculator(vehicleConfig);
    const result = powerCalculator(vehicleConfig, carState, systemMetrics, scenario, subsystems);

    const { demand } = result;
    const findSub = (id: SubSystemName) => subsystems.find(s => s.id === id)!;

    // --- Common logic for all powertrains ---

    // Chassis & Safety
    if (carState.action === CarAction.Braking) {
        let absMultiplier = scenario.roadCondition === RoadCondition.Icy ? 1.5 : scenario.roadCondition === RoadCondition.Wet ? 1.2 : 1;
        demand.absModule += 100 * absMultiplier;
    }
    if (carState.action === CarAction.Turning) {
        demand.powerSteering += 400 * (carState.speed < 30 ? 1 : 0.5); // More power at low speeds
    }

    // Lighting
    if(carState.lightsOn) {
        demand.headlights = 110;
        demand.tailLights = 20;
        demand.instrumentCluster += 20;
    } else {
        demand.daytimeRunningLights = findSub('daytimeRunningLights').basePower;
    }
    if ((scenario.weather === Weather.Rainy || scenario.weather === Weather.Snowy) && carState.lightsOn) {
        demand.fogLights = 80;
    }
    if(carState.action === CarAction.Braking && carState.speed > 0) {
        demand.brakeLights = findSub('brakeLights').maxPower;
    }

    // Climate
    if (carState.hvacOn) {
        const tempDifference = Math.abs(scenario.outsideTemp - 21); // Target 21°C
        demand.hvacBlower = Math.min(findSub('hvacBlower').maxPower, 50 + tempDifference * 15);
        if(scenario.outsideTemp > 24) { // AC compressor
            demand.hvacCompressor = Math.min(findSub('hvacCompressor').maxPower, tempDifference * 50);
        }
    }
    if(carState.seatHeatersOn) {
        demand.seatHeaters = findSub('seatHeaters').maxPower;
    }
    
    // Wipers
    if(carState.wipersOn) {
        let wiperSpeed = (scenario.weather === Weather.Rainy || scenario.weather === Weather.Snowy) ? 100 : 50;
        demand.wipers = wiperSpeed;
    }

    // Interior & Infotainment
    if (carState.speed > 5) {
        demand.audioSystem = findSub('audioSystem').basePower + (carState.speed > 20 ? 50 : 0);
        demand.speakers = demand.audioSystem * 0.5;
    }
    if (scenario.timeOfDay === TimeOfDay.Night) {
        demand.domeLight = findSub('domeLight').basePower;
    }

    // Vehicle-type specific loads
    if (vehicleConfig.carType === 'Truck' || vehicleConfig.carType === 'Bus') {
        demand.airBrakeCompressor = findSub('airBrakeCompressor').basePower + (carState.action === CarAction.Braking ? 500 : 0);
    }
    if (vehicleConfig.carType === 'Special' && vehicleConfig.subType === 'Emergency' && carState.speed > 10) {
        demand.siren = findSub('siren').maxPower;
        demand.strobeLights = findSub('strobeLights').maxPower;
    }

    // Radiator Fan is common, but depends on system temp which is universal
    demand.radiatorFan = Math.max(0, (systemMetrics.systemTemp - 60)) * 10 * (scenario.terrain === Terrain.Uphill ? 1.2 : 1);

    return result;
}