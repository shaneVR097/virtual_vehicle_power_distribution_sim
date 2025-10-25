import type { VehicleConfig, CarState, SystemMetrics, Scenario, SubSystemConfig } from '../../types';
import { CarAction, Terrain } from '../../types';
import type { PowerCalculationResult } from '../behaviorTypes';
import { calculatePower as getICEPower } from './ice';
import { initializeDemand } from '../utils';


export function calculatePower(
    vehicleConfig: VehicleConfig,
    carState: CarState,
    systemMetrics: SystemMetrics,
    scenario: Scenario,
    subsystems: SubSystemConfig[]
): PowerCalculationResult {
    // Hybrids switch to EV mode at low speed/load, with sufficient charge
    const useEVMode = carState.speed < 40 && carState.action !== CarAction.Accelerating && systemMetrics.batteryCharge > 20;

    if (useEVMode) {
        // --- EV MODE ---
        const demand = initializeDemand(subsystems);
        demand.fuelPump = 0;
        demand.starterMotor = 0;
        demand.ecu = subsystems.find(s => s.id === 'ecu')!.basePower + 50; // Controller

        let tractionPower = 0;
        if (carState.action === CarAction.Cruising) {
            // Low power cruising
            tractionPower = 5000 * (1 + carState.speed / 80);
        }
        demand.tractionMotor = tractionPower;
        
        const auxiliaryDemand = Object.values(demand).reduce((sum, val) => sum + val, 0) - tractionPower;
        const totalDemand = auxiliaryDemand + tractionPower;

        let regenPower = 0;
        if (carState.action === CarAction.Braking || (scenario.terrain === Terrain.Downhill && carState.speed > 5)) {
            // Lower regen capability than a full EV
            regenPower = 25000 * (carState.speed / 100);
        }

        const netPower = regenPower - totalDemand;
        
        return { demand, chargeEffect: netPower };

    } else {
        // --- ICE MODE ---
        const iceResult = getICEPower(vehicleConfig, carState, systemMetrics, scenario, subsystems);

        // In ICE mode, we calculate the charge/discharge of the main high-voltage battery.
        // The 12V system loads are handled by the alternator in getICEPower.
        let chargePowerFromEngine = 0;
        
        // If battery is low, engine runs specifically to charge it.
        if (systemMetrics.batteryCharge < 40) {
            chargePowerFromEngine = 5000; // 5kW charge
        } else if (systemMetrics.batteryCharge < 80) {
            chargePowerFromEngine = 2000; // 2kW charge maintenance
        }
        
        let regenPower = 0;
        if (carState.action === CarAction.Braking || (scenario.terrain === Terrain.Downhill && carState.speed > 5)) {
            regenPower = 25000 * (carState.speed / 100);
        }

        // The only *discharge* from the HV battery in this mode is if the motor assists the engine
        let motorAssistPower = 0;
        if (carState.action === CarAction.Accelerating) {
            motorAssistPower = 10000; // 10kW assist
        }
        iceResult.demand.tractionMotor = motorAssistPower;

        const netPower = chargePowerFromEngine + regenPower - motorAssistPower;
        
        // We return the auxiliary demand from the ICE calculation, but the new charge effect for the HV battery.
        return { demand: iceResult.demand, chargeEffect: netPower };
    }
}
