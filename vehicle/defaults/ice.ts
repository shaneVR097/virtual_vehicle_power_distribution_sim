import type { VehicleConfig, CarState, SystemMetrics, Scenario, SubSystemConfig, PowerDistribution, SubSystemName } from '../../types';
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
    const findSub = (id: SubSystemName) => subsystems.find(s => s.id === id)!;
    const terrainModifier = scenario.terrain === Terrain.Uphill ? 1.5 : 1;

    // Handle the one-time ignition event
    if (carState.isIgnitionCycle) {
        demand.starterMotor = findSub('starterMotor').maxPower;
    }

    // Powertrain
    if (carState.speed > 0 || carState.action === CarAction.Idle) {
        demand.fuelPump = findSub('fuelPump').basePower * terrainModifier;
    }
    if (carState.action === CarAction.Accelerating) {
        demand.ecu += 20 * terrainModifier;
        demand.fuelPump += 80 * terrainModifier;
    }
    
    // Alternator/Battery logic
    const totalPowerDraw = Object.values(demand).reduce((sum, val) => sum + val, 0);
    
    // Alternator provides power when engine is running (not during ignition)
    let alternatorPower = 0;
    if (!carState.isIgnitionCycle && (carState.speed > 5 || carState.action === CarAction.Idle)) {
        // High-output for emergency vehicles
        const alternatorCapacity = vehicleConfig.carType === 'Special' ? 5000 : 2000;
        alternatorPower = Math.min(alternatorCapacity, totalPowerDraw + 500); // Powers loads + 500W for charging
    }

    // For a standard ICE, the "chargeEffect" is simply the alternator's power output.
    // The simulation service will subtract the demand to get the net effect on the 12V battery.
    return { demand, chargeEffect: alternatorPower };
}
