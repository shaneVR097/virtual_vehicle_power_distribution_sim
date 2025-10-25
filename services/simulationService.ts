import type { CarState, SystemMetrics, PowerDistribution, Alert, VehicleConfig, Scenario } from '../types';
import { CarAction, TimeOfDay, Weather, Region, DrivingStyle, TrafficDensity, RoadCondition, Terrain } from '../types';
import { SUBSYSTEMS } from '../constants';
import { calculatePowerDistribution } from './localPowerLogic';

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

export function updateSystemMetrics(
    prevMetrics: SystemMetrics,
    powerDistribution: PowerDistribution,
    carState: CarState,
    vehicleConfig: VehicleConfig,
    terrain: Terrain
): SystemMetrics {
    const newMetrics = { ...prevMetrics };
    const totalPowerDraw = Object.values(powerDistribution).reduce((sum, val) => sum + val, 0);
    newMetrics.totalPowerDraw = totalPowerDraw;

    let chargeChange = 0;
    const isRegenBraking = carState.action === CarAction.Braking || terrain === Terrain.Downhill;
    const isCharging = (vehicleConfig.powertrain === 'EV' && isRegenBraking) ||
        (vehicleConfig.powertrain !== 'EV' && carState.speed > 20 && terrain !== Terrain.Uphill);

    if (isCharging) {
        let chargeRate = vehicleConfig.powertrain === 'EV' ? 0.5 : 0.2;
        if (terrain === Terrain.Downhill) chargeRate *= 1.5;
        chargeChange = chargeRate;
    } else {
        const dischargeRate = totalPowerDraw / (vehicleConfig.voltageSystem === '48V' ? 10000 : 5000);
        chargeChange = -dischargeRate;
    }

    newMetrics.batteryCharge = Math.max(0, Math.min(100, newMetrics.batteryCharge + chargeChange));

    const tempChange = (totalPowerDraw / 1500) - 0.2; // Rises with load, cools over time
    newMetrics.systemTemp = Math.max(20, Math.min(90, newMetrics.systemTemp + tempChange));
    
    newMetrics.availablePower = vehicleConfig.voltageSystem === '48V' ? 6000 : 3000;
    if (newMetrics.batteryCharge < 20) {
        newMetrics.availablePower *= newMetrics.batteryCharge / 20;
    }

    return newMetrics;
}

export function checkForAlerts(
    powerDistribution: PowerDistribution,
    systemMetrics: SystemMetrics,
    prevAlerts: Alert[],
): Alert[] {
    const alerts: Alert[] = [];
    const now = Date.now();
    
    const hasRecentAlert = (type: string) => prevAlerts.some(a => a.id.startsWith(type) && (now - a.timestamp) < 10000);

    if (systemMetrics.totalPowerDraw > systemMetrics.availablePower) {
         if (!hasRecentAlert('sys-critical')) {
            alerts.push({ id: `sys-critical-${now}`, subsystem: 'system', message: `CRITICAL OVERLOAD: ${systemMetrics.totalPowerDraw.toFixed(0)}W exceeds available power!`, timestamp: now });
        }
    } else if (systemMetrics.totalPowerDraw > systemMetrics.availablePower * 0.9) {
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
    const nextCarState = updateCarState(carState, nextScenario.region, drivingStyle, nextScenario.terrain);
    
    // Auto-manage systems based on scenario
    nextCarState.lightsOn = nextScenario.timeOfDay !== TimeOfDay.Day || nextScenario.weather === Weather.Rainy || nextScenario.weather === Weather.Snowy;
    nextCarState.wipersOn = nextScenario.weather === Weather.Rainy || nextScenario.weather === Weather.Snowy;
    nextCarState.seatHeatersOn = nextScenario.outsideTemp < 5;

    const tempComfortTrigger = nextScenario.outsideTemp > 25 || nextScenario.outsideTemp < 15;
    if(carState.hvacOn !== tempComfortTrigger && Math.random() < 0.5) {
       // Only toggle sometimes to simulate user preference
       nextCarState.hvacOn = tempComfortTrigger;
    }

    const nextPowerDistribution = calculatePowerDistribution(vehicleConfig, nextCarState, systemMetrics, nextScenario, SUBSYSTEMS);
    const nextSystemMetrics = updateSystemMetrics(systemMetrics, nextPowerDistribution, nextCarState, vehicleConfig, nextScenario.terrain);
    const newAlerts = checkForAlerts(nextPowerDistribution, nextSystemMetrics, prevAlerts);
    
    return {
        nextCarState,
        nextSystemMetrics,
        nextPowerDistribution,
        newAlerts,
        nextScenario
    };
}