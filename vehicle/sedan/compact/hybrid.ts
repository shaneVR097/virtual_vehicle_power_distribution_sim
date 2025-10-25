import type { VehicleConfig, CarState, SystemMetrics, Scenario, SubSystemConfig } from '../../../types';
import { CarAction, Terrain } from '../../../types';
import type { PowerCalculationResult } from '../../behaviorTypes';
import { calculatePower as getEVPower } from '../../defaults/ev';
import { calculatePower as getICEPower } from '../../defaults/ice';

export function calculatePower(
    vehicleConfig: VehicleConfig,
    carState: CarState,
    systemMetrics: SystemMetrics,
    scenario: Scenario,
    subsystems: SubSystemConfig[]
): PowerCalculationResult {
    // Compact hybrids stay in EV mode for longer
    if (carState.speed < 50 && carState.action !== CarAction.Accelerating) {
        const evResult = getEVPower(vehicleConfig, carState, systemMetrics, scenario, subsystems);
        evResult.demand.ecu = subsystems.find(s => s.id === 'ecu')!.basePower;
        return evResult;
    } else {
        const iceResult = getICEPower(vehicleConfig, carState, systemMetrics, scenario, subsystems);
        // Better regen braking on smaller vehicles
        if (carState.action === CarAction.Braking || scenario.terrain === Terrain.Downhill) {
            iceResult.chargeEffect += 400;
        }
        return iceResult;
    }
}
