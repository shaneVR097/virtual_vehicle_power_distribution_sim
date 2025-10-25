import type { VehicleConfig, CarState, SystemMetrics, Scenario, SubSystemConfig, PowerDistribution } from '../types';

export interface PowerCalculationResult {
    demand: PowerDistribution;
    chargeEffect: number;
}

export type VehiclePowerCalculator = (
    vehicleConfig: VehicleConfig,
    carState: CarState,
    systemMetrics: SystemMetrics,
    scenario: Scenario,
    subsystems: SubSystemConfig[]
) => PowerCalculationResult;
