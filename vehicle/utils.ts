import type { SubSystemConfig, PowerDistribution } from '../types';

export const initializeDemand = (subsystems: SubSystemConfig[]): PowerDistribution => {
    return subsystems.reduce((acc, system) => {
        acc[system.id] = system.isConstant ? system.basePower : 0;
        return acc;
    }, {} as PowerDistribution);
};
