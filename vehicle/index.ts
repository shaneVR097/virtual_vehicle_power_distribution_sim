import { CarType, Powertrain } from '../types';
import type { VehiclePowerCalculator } from './behaviorTypes';

import { calculatePower as defaultIce } from './defaults/ice';
import { calculatePower as defaultEv } from './defaults/ev';
import { calculatePower as defaultHybrid } from './defaults/hybrid';
import { calculatePower as sedanCompactHybrid } from './sedan/compact/hybrid';
import { calculatePower as sedanFullSizeFcev } from './sedan/full-size/fcev';
import { calculatePower as sedanMidSizeIce } from './sedan/mid-size/ice';
import { calculatePower as suvFullSizeEv } from './suv/full-size/ev';
import { calculatePower as pickupLightDutyCng } from './pickup/light-duty/cng';
import { calculatePower as truckHeavyIce } from './truck/heavy/ice';
import { calculatePower as specialEmergencyIce } from './special/emergency/ice';

type BehaviorMap = {
    [key in CarType]?: {
        [key: string]: {
            [key in Powertrain]?: VehiclePowerCalculator;
        }
    }
};

export const behaviors: BehaviorMap = {
    [CarType.Sedan]: {
        'Compact': { [Powertrain.Hybrid]: sedanCompactHybrid },
        'Mid-Size': { [Powertrain.ICE]: sedanMidSizeIce },
        'Full-Size': { [Powertrain.FCEV]: sedanFullSizeFcev },
    },
    [CarType.SUV]: {
        'Full-Size': { [Powertrain.EV]: suvFullSizeEv },
    },
    [CarType.Pickup]: {
        'Light-Duty': { [Powertrain.CNG]: pickupLightDutyCng },
    },
    [CarType.Truck]: {
        'Heavy': { [Powertrain.ICE]: truckHeavyIce },
    },
    [CarType.Special]: {
        'Emergency': { [Powertrain.ICE]: specialEmergencyIce },
    },
};

export const defaults: {[key in Powertrain]: VehiclePowerCalculator} = {
    [Powertrain.ICE]: defaultIce,
    [Powertrain.EV]: defaultEv,
    [Powertrain.Hybrid]: defaultHybrid,
    [Powertrain.FCEV]: defaultEv, // FCEV is a type of EV, good default
    [Powertrain.CNG]: defaultIce, // CNG is an ICE variant
    [Powertrain.LPG]: defaultIce, // LPG is an ICE variant
    [Powertrain.FlexFuel]: defaultIce, // FlexFuel is an ICE variant
};
