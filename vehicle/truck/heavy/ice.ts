import { calculatePower as baseCalculatePower } from '../../defaults/ice';
import type { VehicleConfig, CarState, SystemMetrics, Scenario, SubSystemConfig } from '../../../types';
import type { PowerCalculationResult } from '../../behaviorTypes';

export function calculatePower(
    vehicleConfig: VehicleConfig,
    carState: CarState,
    systemMetrics: SystemMetrics,
    scenario: Scenario,
    subsystems: SubSystemConfig[]
): PowerCalculationResult {
    const result = baseCalculatePower(vehicleConfig, carState, systemMetrics, scenario, subsystems);
    
    // Heavy trucks have higher base loads
    result.demand.ecu *= 1.5;
    result.demand.fuelPump *= 1.8;
    result.chargeEffect *= 1.2; // Bigger alternator

    return result;
}
