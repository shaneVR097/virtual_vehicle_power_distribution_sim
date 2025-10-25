import { calculatePower as baseCalculatePower } from '../../defaults/ev';
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
    
    // Large SUVs are heavier and have less effective regenerative braking
    result.chargeEffect *= 0.8;

    return result;
}
