import type { VehicleConfig, CarState, SystemMetrics, Scenario, SubSystemConfig } from '../../types';
import { CarAction, Terrain } from '../../types';
import type { PowerCalculationResult } from '../behaviorTypes';
import { initializeDemand } from '../utils';

export function calculatePower(
    vehicleConfig: VehicleConfig,
    carState: CarState,
    systemMetrics: SystemMetrics,
    scenario: Scenario,
    subsystems: SubSystemConfig[]
): PowerCalculationResult {
    const demand = initializeDemand(subsystems);
    
    // EV-specific powertrain demand
    demand.fuelPump = 0;
    demand.starterMotor = 0;
    demand.ecu += 75; // Base draw for inverter and motor controller

    // --- Calculate Traction Motor Power Draw ---
    let tractionPower = 0;
    const terrainModifier = scenario.terrain === Terrain.Uphill ? 2.5 : (scenario.terrain === Terrain.Downhill ? 0.2 : 1);
    const speedModifier = 1 + (carState.speed / 100); // Higher speed needs more power to maintain

    switch(carState.action) {
        case CarAction.Accelerating:
            // High power draw for acceleration, e.g., up to 150kW
            tractionPower = 150000 * terrainModifier;
            break;
        case CarAction.Cruising:
            // Lower power draw for cruising, depends on speed
            tractionPower = 15000 * speedModifier * terrainModifier;
            break;
        case CarAction.Idle:
        case CarAction.Braking:
            tractionPower = 0; // No power draw, regen is handled separately
            break;
    }
    demand.tractionMotor = tractionPower;


    // Sum of auxiliary demand (excluding traction motor which is handled separately for battery calculation)
    const auxiliaryDemand = Object.values(demand).reduce((sum, val) => sum + val, 0) - tractionPower;

    // Total power being drawn from the battery
    const totalDemand = auxiliaryDemand + tractionPower;

    // --- Calculate Regenerative Braking Power ---
    let regenPower = 0;
    const isRegen = carState.action === CarAction.Braking || (scenario.terrain === Terrain.Downhill && carState.speed > 5);
    if (isRegen) {
        // Max regen power of 60kW, scales with speed
        let baseRegen = 60000 * (carState.speed / 120);
        if (carState.action === CarAction.Braking) {
            baseRegen *= 1.5; // More aggressive regen when braking
        }
        if (scenario.terrain === Terrain.Downhill) {
            baseRegen *= 1.2;
        }
        regenPower = Math.min(60000, baseRegen);
    }
    
    // --- Calculate Net effect on Battery ---
    // Net power is regen minus demand. Positive means charging, negative means discharging.
    const netPower = regenPower - totalDemand;

    return { demand, chargeEffect: netPower };
}
