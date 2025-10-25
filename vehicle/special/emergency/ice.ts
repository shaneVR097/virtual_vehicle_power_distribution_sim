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
    
    // Emergency vehicles have high-output alternators
    result.chargeEffect *= 2.5;

    return result;
}
