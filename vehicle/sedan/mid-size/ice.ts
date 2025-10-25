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
    // Sedans are efficient, slightly better alternator performance
    result.chargeEffect *= 1.05;
    return result;
}
