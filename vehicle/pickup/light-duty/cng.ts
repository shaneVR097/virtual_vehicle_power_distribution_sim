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
    
    // CNG might be slightly less efficient, higher ECU load for management
    result.demand.ecu *= 1.1;
    result.chargeEffect *= 0.95; // slightly less efficient alternator charging

    return result;
}
