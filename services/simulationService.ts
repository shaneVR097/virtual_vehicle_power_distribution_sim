import type { CarState, SystemMetrics, PowerDistribution, Alert, VehicleConfig, Scenario, HistoryEntry, BatteryParameters } from '../types';
import { CarAction, TimeOfDay, Weather, Region, DrivingStyle, TrafficDensity, RoadCondition, Terrain, Powertrain } from '../types';
import { SUBSYSTEMS, SIMULATION_TICK_RATE_MS, getBatteryParameters } from '../constants';
import { calculateDemandAndCharge } from './localPowerLogic';
import { checkPowerIntegrityAndShedLoad } from './powerIntegrityService';

export function updateCarState(prevState: CarState, region: Region, drivingStyle: DrivingStyle, terrain: Terrain): CarState {
    const newState = { ...prevState };
    let randomFactor = Math.random();

    // Base probabilities
    const baseProbs = {
        [Region.City]: { [CarAction.Accelerating]: 0.3, [CarAction.Braking]: 0.4, [CarAction.Idle]: 0.2, [CarAction.Cruising]: 0.1 },
        [Region.Suburban]: { [CarAction.Accelerating]: 0.25, [CarAction.Braking]: 0.2, [CarAction.Idle]: 0.1, [CarAction.Cruising]: 0.45 },
        [Region.Highway]: { [CarAction.Accelerating]: 0.1, [CarAction.Braking]: 0.05, [CarAction.Idle]: 0.05, [CarAction.Cruising]: 0.8 },
        [Region.Offroad]: { [CarAction.Accelerating]: 0.4, [CarAction.Braking]: 0.3, [CarAction.Idle]: 0.1, [CarAction.Cruising]: 0.2 },
    };

    // Modify probabilities based on driving style
    const styleMultiplier = {
        [DrivingStyle.Eco]: { accel: 0.5, brake: 1, cruise: 1.5, idle: 1.2 },
        [DrivingStyle.Comfort]: { accel: 0.8, brake: 1, cruise: 1.2, idle: 1.1 },
        [DrivingStyle.Normal]: { accel: 1, brake: 1, cruise: 1, idle: 1 },
        [DrivingStyle.Sport]: { accel: 1.5, brake: 1.2, cruise: 0.7, idle: 0.8 },
        [DrivingStyle.Aggressive]: { accel: 2.0, brake: 1.5, cruise: 0.5, idle: 0.5 },
    };
    
    const multiplier = styleMultiplier[drivingStyle];
    const regionalProbs = baseProbs[region];
    const modifiedProbs = {
        [CarAction.Accelerating]: regionalProbs[CarAction.Accelerating] * multiplier.accel,
        [CarAction.Braking]: regionalProbs[CarAction.Braking] * multiplier.brake,
        [CarAction.Cruising]: regionalProbs[CarAction.Cruising] * multiplier.cruise,
        [CarAction.Idle]: regionalProbs[CarAction.Idle] * multiplier.idle,
    };
    
    const totalProb = Object.values(modifiedProbs).reduce((a, b) => a + b, 0);
    const normalizedProbs = {
        [CarAction.Accelerating]: modifiedProbs[CarAction.Accelerating] / totalProb,
        [CarAction.Braking]: modifiedProbs[CarAction.Braking] / totalProb,
        [CarAction.Cruising]: modifiedProbs[CarAction.Cruising] / totalProb,
        [CarAction.Idle]: modifiedProbs[CarAction.Idle] / totalProb,
    };


    let cumulative = 0;
    for (const action in normalizedProbs) {
        cumulative += normalizedProbs[action as CarAction];
        if (randomFactor <= cumulative) {
            newState.action = action as CarAction;
            break;
        }
    }
    
    // Update speed based on action and driving style
    const speedMultiplier = {
        [DrivingStyle.Eco]: 0.7,
        [DrivingStyle.Comfort]: 0.9,
        [DrivingStyle.Normal]: 1.0,
        [DrivingStyle.Sport]: 1.2,
        [DrivingStyle.Aggressive]: 1.5,
    };
    const speedMod = speedMultiplier[drivingStyle];
    
    const terrainEffect = terrain === Terrain.Uphill ? -5 : terrain === Terrain.Downhill ? 5 : 0;

    switch (newState.action) {
        case CarAction.Accelerating:
            newState.speed = Math.min(180, newState.speed + 15 * speedMod + terrainEffect);
            break;
        case CarAction.Braking:
            newState.speed = Math.max(0, newState.speed - 20 * speedMod + terrainEffect);
            break;
        case CarAction.Cruising:
            newState.speed += (Math.random() - 0.5) * 5 + terrainEffect;
            const maxSpeed = region === Region.Highway ? 130 : 80;
            newState.speed = Math.max(20, Math.min(maxSpeed * speedMod, newState.speed));
            break;
        case CarAction.Idle:
            newState.speed = Math.max(0, newState.speed - 10 + terrainEffect);
            if (newState.speed < 0) newState.speed = 0;
            break;
    }
    if (newState.speed < 0) newState.speed = 0;

    return newState;
}

export function updateScenario(prevScenario: Scenario): Scenario {
    const newScenario = { ...prevScenario };
    const random = Math.random();

    if (random < 0.1) { // 10% chance to change region
        const regions = Object.values(Region);
        newScenario.region = regions[Math.floor(Math.random() * regions.length)];
    } else if (random < 0.15) { // 5% chance to change weather
        const weathers = Object.values(Weather);
        const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
        if (newWeather !== newScenario.weather) {
            newScenario.weather = newWeather;
            newScenario.roadCondition = newWeather === Weather.Rainy ? RoadCondition.Wet : newWeather === Weather.Snowy ? RoadCondition.Icy : RoadCondition.Dry;
            switch(newWeather) {
                case Weather.Sunny: newScenario.outsideTemp = 28; break;
                case Weather.Cloudy: newScenario.outsideTemp = 18; break;
                case Weather.Rainy: newScenario.outsideTemp = 12; break;
                case Weather.Snowy: newScenario.outsideTemp = -2; break;
            }
        }
    } else if (random < 0.2) { // 5% chance to change time of day
        const times = Object.values(TimeOfDay);
        newScenario.timeOfDay = times[(times.indexOf(newScenario.timeOfDay) + 1) % times.length];
    } else if (random < 0.25) { // 5% chance to change traffic
        const traffic = Object.values(TrafficDensity);
        newScenario.traffic = traffic[Math.floor(Math.random() * traffic.length)];
    } else if (random < 0.3) { // 5% chance to change terrain
        const terrains = Object.values(Terrain);
        newScenario.terrain = terrains[Math.floor(Math.random() * terrains.length)];
    }

    return newScenario;
}

export function forceUpdateScenario(): Scenario {
    const times = Object.values(TimeOfDay);
    const weathers = Object.values(Weather);
    const regions = Object.values(Region);
    const traffic = Object.values(TrafficDensity);
    const terrains = Object.values(Terrain);

    const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
    const roadCondition = newWeather === Weather.Rainy ? RoadCondition.Wet : newWeather === Weather.Snowy ? RoadCondition.Icy : RoadCondition.Dry;
    let outsideTemp = 22;
    switch(newWeather) {
        case Weather.Sunny: outsideTemp = 28; break;
        case Weather.Cloudy: outsideTemp = 18; break;
        case Weather.Rainy: outsideTemp = 12; break;
        case Weather.Snowy: outsideTemp = -2; break;
    }

    return {
        timeOfDay: times[Math.floor(Math.random() * times.length)],
        weather: newWeather,
        region: regions[Math.floor(Math.random() * regions.length)],
        traffic: traffic[Math.floor(Math.random() * traffic.length)],
        roadCondition,
        outsideTemp,
        terrain: terrains[Math.floor(Math.random() * terrains.length)],
    }
}

interface DegradationResult {
    newSoH: number;
    socDrain: number; // A negative percentage value to be applied to SoC
}

// Base degradation values per tick (1.5s)
const BASE_SOH_DEGRADATION_PER_TICK = 0.000005; 
const BASE_SOC_DRAIN_PER_TICK = 0.0001; 

function calculateDegradation(
    metrics: SystemMetrics,
    config: VehicleConfig,
    batteryParams: BatteryParameters,
): DegradationResult {
    let sohDegradation = BASE_SOH_DEGRADATION_PER_TICK;
    let socDrain = BASE_SOC_DRAIN_PER_TICK;

    const ahCapacity = batteryParams.capacityWh / batteryParams.nominalVoltage;
    if (ahCapacity > 0) {
        const cRate = Math.abs(metrics.batteryCurrent) / ahCapacity;
        if (cRate > 2) { // High C-rate
            sohDegradation *= 2.0;
        } else if (cRate > 1) {
            sohDegradation *= 1.4;
        }
    }

    if (metrics.systemTemp > 70) {
        sohDegradation *= 2.5;
        socDrain *= 2;
    } else if (metrics.systemTemp > 50) {
        sohDegradation *= 1.5;
    } else if (metrics.systemTemp < 5) {
        sohDegradation *= 1.2; // Degradation at low temps
    }

    if (metrics.batteryCharge < 20) {
        sohDegradation *= 1.8;
    } else if (metrics.batteryCharge > 95) {
        sohDegradation *= 1.2;
    }
    
    const newSoH = Math.max(0, metrics.batterySoh - sohDegradation);

    return {
        newSoH,
        socDrain: -socDrain,
    };
}


export function updateSystemMetrics(
    prevMetrics: SystemMetrics,
    powerDistribution: PowerDistribution,
    netPowerFromSource: number, // Watts. Positive for regen/alternator.
    vehicleConfig: VehicleConfig,
    scenario: Scenario,
): SystemMetrics {
    const newMetrics = { ...prevMetrics };
    const totalPowerDraw = Object.values(powerDistribution).reduce((sum, val) => sum + val, 0);
    newMetrics.totalPowerDraw = totalPowerDraw;

    const batteryParams = getBatteryParameters(vehicleConfig);

    // 1. State of Health (SoH) - calculated first to affect other params
    const { newSoH, socDrain } = calculateDegradation(newMetrics, vehicleConfig, batteryParams);
    newMetrics.batterySoh = newSoH;

    // 2. Net power on the battery. Positive = charging, negative = discharging.
    const netBatteryPower = netPowerFromSource - totalPowerDraw;

    // 3. Estimate battery current (I = P/V). I > 0 for discharge.
    const V_prev = newMetrics.batteryVoltage || batteryParams.nominalVoltage;
    newMetrics.batteryCurrent = -netBatteryPower / V_prev;

    // 4. Update Temperature with Joule heating and cooling
    const tempFactor = 1 + Math.max(0, (25 - newMetrics.systemTemp) / 50); // R increases below 25C
    const sohFactor = 1 + (100 - newMetrics.batterySoh) / 100; // R increases as SoH drops
    const internalResistance = batteryParams.internalResistanceOhms * tempFactor * sohFactor;

    const powerLossWatts = (newMetrics.batteryCurrent ** 2) * internalResistance;
    const tempDiff = newMetrics.systemTemp - scenario.outsideTemp;
    const coolingEffectWatts = tempDiff > 0 ? tempDiff * 5 : 0;
    const netHeatingWatts = powerLossWatts - coolingEffectWatts;
    
    const thermalMass = batteryParams.massKg * batteryParams.specificHeatCapacity;
    const tempChange = (netHeatingWatts * (SIMULATION_TICK_RATE_MS / 1000)) / thermalMass;
    newMetrics.systemTemp = Math.max(-10, Math.min(90, newMetrics.systemTemp + tempChange));

    // 5. Update battery voltage: V_batt = V_oc(SOC) - I*R
    const voltageSag = newMetrics.batteryCurrent * internalResistance;
    const openCircuitVoltage = batteryParams.nominalVoltage * (0.90 + (prevMetrics.batteryCharge / 666));
    newMetrics.batteryVoltage = openCircuitVoltage - voltageSag;

    // 6. Update State of Charge (SOC)
    const energyChangeWh = netBatteryPower * (SIMULATION_TICK_RATE_MS / 1000) / 3600;
    const effectiveCapacityWh = batteryParams.capacityWh * (newMetrics.batterySoh / 100);
    if (effectiveCapacityWh > 0) {
      const socChange = (energyChangeWh / effectiveCapacityWh) * 100;
      newMetrics.batteryCharge = Math.max(0, Math.min(100, prevMetrics.batteryCharge + socChange + socDrain));
    }
    
    // 7. Update Available Power
    const socPowerFactor = newMetrics.batteryCharge < 10 ? newMetrics.batteryCharge / 10 : 1;
    const tempPowerFactor = newMetrics.systemTemp < 0 ? 0.4 : 1;
    const sohPowerFactor = newMetrics.batterySoh / 100;
    
    const ahCapacity = effectiveCapacityWh / batteryParams.nominalVoltage;
    const maxDischargeCurrent = ahCapacity > 0 ? ahCapacity * 4 : 0; // 4C max discharge
    const maxPowerFromBattery = newMetrics.batteryVoltage * maxDischargeCurrent;
    newMetrics.availablePower = maxPowerFromBattery * socPowerFactor * tempPowerFactor * sohPowerFactor + netPowerFromSource;

    return newMetrics;
}


export function checkForAlerts(
    systemMetrics: SystemMetrics,
    prevAlerts: Alert[],
): Alert[] {
    const alerts: Alert[] = [];
    const now = Date.now();
    
    const hasRecentAlert = (type: string) => prevAlerts.some(a => a.id.startsWith(type) && (now - a.timestamp) < 10000);

    if (systemMetrics.totalPowerDraw > systemMetrics.availablePower * 0.9 && systemMetrics.totalPowerDraw <= systemMetrics.availablePower) {
        if (!hasRecentAlert('sys-overload')) {
            alerts.push({ id: `sys-overload-${now}`, subsystem: 'system', message: `High Load: ${systemMetrics.totalPowerDraw.toFixed(0)}W draw nearing capacity.`, timestamp: now });
        }
    }
    
    if (systemMetrics.systemTemp > 80) {
         if (!hasRecentAlert('sys-temp')) {
            alerts.push({ id: `sys-temp-${now}`, subsystem: 'system', message: `High Temperature: ${systemMetrics.systemTemp.toFixed(1)}°C.`, timestamp: now });
        }
    }
    
    if (systemMetrics.batteryCharge < 15) {
         if (!hasRecentAlert('sys-battery')) {
            alerts.push({ id: `sys-battery-${now}`, subsystem: 'system', message: `Low Battery: ${systemMetrics.batteryCharge.toFixed(1)}%.`, timestamp: now });
        }
    }

    if (systemMetrics.batterySoh < 90) {
         if (!hasRecentAlert('sys-soh')) {
            alerts.push({ id: `sys-soh-${now}`, subsystem: 'system', message: `Battery Health Alert: SoH at ${systemMetrics.batterySoh.toFixed(1)}%. Performance degraded.`, timestamp: now });
        }
    }

    return alerts;
}

export function runSimulationTick(
    vehicleConfig: VehicleConfig,
    carState: CarState,
    systemMetrics: SystemMetrics,
    scenario: Scenario,
    autoScenario: boolean,
    drivingStyle: DrivingStyle,
    prevAlerts: Alert[],
): {
    nextCarState: CarState;
    nextSystemMetrics: SystemMetrics;
    nextPowerDistribution: PowerDistribution;
    newAlerts: Alert[];
    nextScenario: Scenario;
} {
    const nextScenario = autoScenario ? updateScenario(scenario) : scenario;
    let nextCarState = updateCarState(carState, nextScenario.region, drivingStyle, nextScenario.terrain);
    
    // Auto-manage systems based on scenario
    nextCarState.lightsOn = nextScenario.timeOfDay !== TimeOfDay.Day || nextScenario.weather === Weather.Rainy || nextScenario.weather === Weather.Snowy;
    nextCarState.wipersOn = nextScenario.weather === Weather.Rainy || nextScenario.weather === Weather.Snowy;
    nextCarState.seatHeatersOn = nextScenario.outsideTemp < 5;

    const tempComfortTrigger = nextScenario.outsideTemp > 25 || nextScenario.outsideTemp < 15;
    if(carState.hvacOn !== tempComfortTrigger && Math.random() < 0.5) {
       // Only toggle sometimes to simulate user preference
       nextCarState.hvacOn = tempComfortTrigger;
    }
    
    // 1. Calculate raw demand and charge effect based on powertrain logic
    const { demand, chargeEffect } = calculateDemandAndCharge(vehicleConfig, nextCarState, systemMetrics, nextScenario, SUBSYSTEMS);
    
    // Turn off ignition cycle after first tick
    if (nextCarState.isIgnitionCycle) {
        nextCarState = {...nextCarState, isIgnitionCycle: false};
    }

    // 2. Validate against available power and shed load if necessary
    const { finalDistribution, integrityAlerts } = checkPowerIntegrityAndShedLoad(demand, systemMetrics, SUBSYSTEMS);

    // 3. Update system metrics with final, validated power distribution
    const nextSystemMetrics = updateSystemMetrics(systemMetrics, finalDistribution, chargeEffect, vehicleConfig, nextScenario);
    
    // 4. Check for other system alerts
    const systemAlerts = checkForAlerts(nextSystemMetrics, prevAlerts);
    const newAlerts = [...integrityAlerts, ...systemAlerts];
    
    return {
        nextCarState,
        nextSystemMetrics,
        nextPowerDistribution: finalDistribution,
        newAlerts,
        nextScenario
    };
}