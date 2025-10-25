import type { VehicleConfig } from '../types';
import { behaviors, defaults } from '../vehicle';
import type { VehiclePowerCalculator } from '../vehicle/behaviorTypes';

export function getVehiclePowerCalculator(config: VehicleConfig): VehiclePowerCalculator {
    const { carType, subType, powertrain } = config;

    const carBehavior = behaviors[carType];
    if (carBehavior) {
        const subTypeBehavior = carBehavior[subType];
        if (subTypeBehavior) {
            const powertrainBehavior = subTypeBehavior[powertrain];
            if (powertrainBehavior) {
                return powertrainBehavior;
            }
        }
    }

    // Fallback to default for the powertrain
    return defaults[powertrain];
}
