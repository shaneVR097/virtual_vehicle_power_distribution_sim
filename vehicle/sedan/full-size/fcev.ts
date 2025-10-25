import type { VehicleConfig, CarState, SystemMetrics, Scenario, SubSystemConfig } from '../../../types';
import { CarAction, Terrain } from '../../../types';
import type { PowerCalculationResult } from '../../behaviorTypes';
import { initializeDemand } from '../../utils';

export function calculatePower(
    vehicleConfig: VehicleConfig,
    carState: CarState,
    systemMetrics: SystemMetrics,
    scenario: Scenario,
    subsystems: SubSystemConfig[]
): PowerCalculationResult {
    const demand = initializeDemand(subsystems);
    
    // FCEV-specific powertrain demand
    demand.fuelPump = 0; // It's a hydrogen pump, different system, bundled into ECU
    demand.starterMotor = 0;
    demand.ecu += 150; // Fuel cell controller, compressors, pumps are significant

    // --- Calculate Traction Motor Power Draw ---
    let tractionPower = 0;
    const terrainModifier = scenario.terrain === Terrain.Uphill ? 2.5 : (scenario.terrain === Terrain.Downhill ? 0.2 : 1);
    const speedModifier = 1 + (carState.speed / 100);

    switch(carState.action) {
        case CarAction.Accelerating:
            tractionPower = 150000 * terrainModifier;
            break;
        case CarAction.Cruising:
            tractionPower = 15000 * speedModifier * terrainModifier;
            break;
        case CarAction.Idle:
        case CarAction.Braking:
            tractionPower = 0;
            break;
    }
    demand.tractionMotor = tractionPower;

    const auxiliaryDemand = Object.values(demand).reduce((sum, val) => sum + val, 0) - tractionPower;
    const totalDemand = auxiliaryDemand + tractionPower;

    // --- Fuel Cell Power Generation ---
    // Fuel cell generates power to meet demand, plus some to charge the buffer battery.
    // It's not instantly responsive, so the buffer battery covers the gap.
    // We model it as trying to meet demand + 2kW for charging.
    const fuelCellPower = totalDemand > 100 ? Math.min(90000, totalDemand + 2000) : 5000;

    // --- Regenerative Braking Power ---
    let regenPower = 0;
    const isRegen = carState.action === CarAction.Braking || (scenario.terrain === Terrain.Downhill && carState.speed > 5);
    if (isRegen) {
        let baseRegen = 50000 * (carState.speed / 120); // Slightly less regen than pure EV
        if (carState.action === CarAction.Braking) baseRegen *= 1.5;
        if (scenario.terrain === Terrain.Downhill) baseRegen *= 1.2;
        regenPower = Math.min(50000, baseRegen);
    }
    
    // --- Calculate Net effect on Buffer Battery ---
    const netPower = fuelCellPower + regenPower - totalDemand;

    return { demand, chargeEffect: netPower };
}
