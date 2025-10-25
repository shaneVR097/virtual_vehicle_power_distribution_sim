import type { VehicleConfig, CarState, SystemMetrics, Scenario, SubSystemConfig, PowerDistribution, SubSystemName } from '../types';
import { CarAction, TimeOfDay, Weather, Powertrain, RoadCondition, Terrain } from '../types';

export function calculatePowerDistribution(
    vehicleConfig: VehicleConfig,
    carState: CarState,
    systemMetrics: SystemMetrics,
    scenario: Scenario,
    subsystems: SubSystemConfig[]
): PowerDistribution {
    const distribution = subsystems.reduce((acc, system) => {
        // Initialize with base power for constant loads, otherwise 0
        acc[system.id] = system.isConstant ? system.basePower : 0;
        return acc;
    }, {} as PowerDistribution);

    const findSub = (id: SubSystemName) => subsystems.find(s => s.id === id)!;
    const isICEBased = vehicleConfig.powertrain === Powertrain.ICE || vehicleConfig.powertrain === Powertrain.Hybrid || vehicleConfig.powertrain === Powertrain.FlexFuel || vehicleConfig.powertrain === Powertrain.CNG || vehicleConfig.powertrain === Powertrain.LPG;

    // --- Calculate variable demand for each subsystem ---

    // Powertrain related
    const terrainModifier = scenario.terrain === Terrain.Uphill ? 1.5 : 1;
    if (isICEBased) {
        if(carState.speed > 0 || carState.action === CarAction.Idle) {
             distribution.fuelPump = findSub('fuelPump').basePower * terrainModifier;
        }
        if (carState.action === CarAction.Accelerating) {
            distribution.ecu += 20 * terrainModifier;
            distribution.fuelPump += 80 * terrainModifier;
        }
    } else { // EV, FCEV
        distribution.fuelPump = 0;
        distribution.starterMotor = 0;
    }
    
    distribution.radiatorFan = Math.max(0, (systemMetrics.systemTemp - 60)) * 10 * (scenario.terrain === Terrain.Uphill ? 1.2 : 1); // Fan ramps up after 60C, works harder uphill

    // Chassis & Safety
    if (carState.action === CarAction.Braking) {
        let absMultiplier = scenario.roadCondition === RoadCondition.Icy ? 1.5 : scenario.roadCondition === RoadCondition.Wet ? 1.2 : 1;
        distribution.absModule += 100 * absMultiplier;
    }
    if (carState.action === CarAction.Turning) {
        distribution.powerSteering += 400 * (carState.speed < 30 ? 1 : 0.5); // More power needed at low speeds
    }

    // Lighting
    if(carState.lightsOn) {
        distribution.headlights = 110;
        distribution.tailLights = 20;
        distribution.instrumentCluster += 20; // Brighter at night
    } else {
        distribution.daytimeRunningLights = findSub('daytimeRunningLights').basePower;
    }
    if ((scenario.weather === Weather.Rainy || scenario.weather === Weather.Snowy) && carState.lightsOn) {
        distribution.fogLights = 80;
    }
    if(carState.action === CarAction.Braking && carState.speed > 0) {
        distribution.brakeLights = findSub('brakeLights').maxPower;
    }

    // Climate
    if (carState.hvacOn) {
        const tempDifference = Math.abs(scenario.outsideTemp - 21); // Target 21°C
        distribution.hvacBlower = Math.min(findSub('hvacBlower').maxPower, 50 + tempDifference * 15);
        if(scenario.outsideTemp > 24) { // AC compressor for cooling
            distribution.hvacCompressor = Math.min(findSub('hvacCompressor').maxPower, tempDifference * 50);
        }
    }
    if(carState.seatHeatersOn) {
        distribution.seatHeaters = findSub('seatHeaters').maxPower;
    }
    
    // Wipers
    if(carState.wipersOn) {
        let wiperSpeed = (scenario.weather === Weather.Rainy || scenario.weather === Weather.Snowy) ? 100 : 50;
        distribution.wipers = wiperSpeed;
    }

    // Interior & Infotainment
    if (carState.speed > 5) {
        distribution.audioSystem = findSub('audioSystem').basePower + (carState.speed > 20 ? 50 : 0); // Louder at speed
        distribution.speakers = distribution.audioSystem * 0.5;
    }

    if (scenario.timeOfDay === TimeOfDay.Night) {
        distribution.domeLight = findSub('domeLight').basePower;
    }
    
    // --- Load Shedding if total exceeds available power ---
    let totalDemand = Object.values(distribution).reduce((sum, val) => sum + val, 0);

    if (totalDemand > systemMetrics.availablePower) {
        const sortedByPriority = [...subsystems].sort((a, b) => a.priority - b.priority);
        let deficit = totalDemand - systemMetrics.availablePower;

        for (const sub of sortedByPriority) {
            if (deficit <= 0) break;
            
            const currentPower = distribution[sub.id];
            // Constant loads can also be shed under extreme circumstances, down to a minimum operational level (or 0)
            const basePower = sub.isConstant ? sub.basePower / 2 : 0; 
            const reduciblePower = currentPower - basePower;

            if (reduciblePower > 0) {
                const reduction = Math.min(deficit, reduciblePower);
                distribution[sub.id] -= reduction;
                deficit -= reduction;
            }
        }
    }
    
    // Final check to ensure no subsystem exceeds its max power
    for(const key in distribution) {
        const subsystemName = key as SubSystemName;
        const maxPower = findSub(subsystemName).maxPower;
        if(distribution[subsystemName] > maxPower) {
            distribution[subsystemName] = maxPower;
        }
         if(distribution[subsystemName] < 0) {
            distribution[subsystemName] = 0;
        }
    }

    return distribution;
}