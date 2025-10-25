import type { PowerDistribution, SystemMetrics, SubSystemConfig, Alert, SubSystemName } from '../types';

export function checkPowerIntegrityAndShedLoad(
    demand: PowerDistribution,
    systemMetrics: SystemMetrics,
    subsystems: SubSystemConfig[]
): { finalDistribution: PowerDistribution, integrityAlerts: Alert[] } {
    
    const finalDistribution = { ...demand };
    const integrityAlerts: Alert[] = [];
    const now = Date.now();

    const totalDemand = Object.values(finalDistribution).reduce((sum, val) => sum + val, 0);

    if (totalDemand > systemMetrics.availablePower) {
        integrityAlerts.push({ 
            id: `sys-integrity-${now}`, 
            subsystem: 'system', 
            message: `Power integrity breach: Demand of ${totalDemand.toFixed(0)}W exceeds available ${systemMetrics.availablePower.toFixed(0)}W. Initiating load shedding.`, 
            timestamp: now 
        });

        // Load Shedding logic
        const sortedByPriority = [...subsystems].sort((a, b) => a.priority - b.priority);
        let deficit = totalDemand - systemMetrics.availablePower;

        for (const sub of sortedByPriority) {
            if (deficit <= 0) break;
            
            const currentPower = finalDistribution[sub.id];
            // Constant loads can also be shed under extreme circumstances, down to a minimum operational level (or 0)
            const basePower = sub.isConstant ? sub.basePower / 2 : 0; 
            const reduciblePower = currentPower - basePower;

            if (reduciblePower > 0) {
                const reduction = Math.min(deficit, reduciblePower);
                finalDistribution[sub.id] -= reduction;
                deficit -= reduction;
            }
        }
    }
    
    // Final check to ensure no subsystem exceeds its max power after all calculations
    for(const key in finalDistribution) {
        const subsystemName = key as SubSystemName;
        const subConfig = subsystems.find(s => s.id === subsystemName);
        if (!subConfig) continue;

        const maxPower = subConfig.maxPower;
        if(finalDistribution[subsystemName] > maxPower) {
            finalDistribution[subsystemName] = maxPower;
        }
         if(finalDistribution[subsystemName] < 0) {
            finalDistribution[subsystemName] = 0;
        }
    }

    return { finalDistribution, integrityAlerts };
}
