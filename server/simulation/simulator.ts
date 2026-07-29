import { store } from '../db/store.js';
import { WorkflowOrchestrator } from '../workflows/orchestrator.js';

export interface SimulationStepResult {
  stepName: string;
  message: string;
  affectedBinId?: string;
  affectedRouteId?: string;
  affectedCampaignId?: string;
  timestamp: string;
}

export class SimulationEngine {
  private static demoStepIndex = 0;

  // 1. Generate New Random Waste Event
  public static generateNewWasteEvent() {
    const randomBin = store.bins[Math.floor(Math.random() * store.bins.length)];
    const fillIncrease = Math.floor(15 + Math.random() * 25);
    randomBin.fillLevel = Math.min(100, randomBin.fillLevel + fillIncrease);
    randomBin.status = store.getBinStatus(randomBin.fillLevel);
    randomBin.priority = store.getPriority(randomBin.status);
    randomBin.lastUpdated = new Date().toISOString();

    store.saveToDisk();

    return {
      message: `Waste generated at ${randomBin.locationName}. Fill level increased by ${fillIncrease}% to ${randomBin.fillLevel}%.`,
      bin: randomBin
    };
  }

  // 2. Increase Bin Fill on Specific or Random Bin
  public static increaseBinFill(binId?: string, delta = 25) {
    let target = store.bins.find(b => b.binId === binId || b.id === binId);
    if (!target) {
      target = store.bins[Math.floor(Math.random() * store.bins.length)];
    }

    target.fillLevel = Math.min(100, target.fillLevel + delta);
    target.status = store.getBinStatus(target.fillLevel);
    target.priority = store.getPriority(target.status);
    target.lastUpdated = new Date().toISOString();

    if (target.status === 'CRITICAL') {
      store.alerts.unshift({
        id: `ALT-${Date.now().toString().slice(-5)}`,
        severity: 'CRITICAL',
        title: 'Critical Bin Overflow Alert',
        message: `${target.binId} (${target.locationName}) reached ${target.fillLevel}% CRITICAL capacity.`,
        timestamp: new Date().toISOString(),
        entityId: target.binId,
        entityType: 'bin'
      });
    }

    store.saveToDisk();

    return {
      message: `Increased ${target.binId} fill to ${target.fillLevel}% (${target.status})`,
      bin: target
    };
  }

  // 3. Simulate Overflow on a specific bin
  public static simulateOverflow(binId = 'BIN-005') {
    let target = store.bins.find(b => b.binId === binId || b.id === binId);
    if (!target) target = store.bins[0];

    target.fillLevel = 98;
    target.status = 'CRITICAL';
    target.priority = 'URGENT';
    target.estimatedOverflowRisk = 0.98;
    target.lastUpdated = new Date().toISOString();

    store.alerts.unshift({
      id: `ALT-${Date.now().toString().slice(-5)}`,
      severity: 'CRITICAL',
      title: 'CRITICAL OVERFLOW DETECTED',
      message: `${target.binId} in ${target.locationName} is at 98% capacity. Immediate dispatch required.`,
      timestamp: new Date().toISOString(),
      entityId: target.binId,
      entityType: 'bin'
    });

    store.saveToDisk();

    return {
      message: `Simulated critical overflow on ${target.binId} (${target.locationName})`,
      bin: target
    };
  }

  // 4. Simulate Traffic Event
  public static simulateTraffic(neighborhood = 'Gandhipuram', severity: 'MODERATE' | 'HEAVY' = 'HEAVY') {
    const roadName = `${neighborhood} Main Arterial Route`;
    const existing = store.trafficEvents.find(t => t.neighborhood === neighborhood);

    if (existing) {
      existing.severity = severity;
      existing.active = true;
      existing.description = `Simulated heavy rush hour traffic jam in ${neighborhood}.`;
    } else {
      store.trafficEvents.unshift({
        id: `TRAF-${Date.now().toString().slice(-4)}`,
        roadName,
        neighborhood,
        severity,
        description: `Simulated heavy rush hour congestion in ${neighborhood}.`,
        active: true,
        lat: 11.0180,
        lng: 76.9580
      });
    }

    store.alerts.unshift({
      id: `ALT-${Date.now().toString().slice(-5)}`,
      severity: 'WARNING',
      title: 'Traffic Jam Alert',
      message: `Heavy traffic detected in ${neighborhood}. Route travel times increased by 60%.`,
      timestamp: new Date().toISOString()
    });

    store.saveToDisk();

    return {
      message: `Simulated ${severity} traffic congestion in ${neighborhood}.`,
      traffic: store.trafficEvents
    };
  }

  // 5. Simulate Road Closure
  public static closeRoad(neighborhood = 'RS Puram', roadName = 'DB Road North Axis') {
    const existing = store.roadClosures.find(rc => rc.neighborhood === neighborhood);
    if (existing) {
      existing.active = true;
    } else {
      store.roadClosures.unshift({
        id: `ROAD-${Date.now().toString().slice(-4)}`,
        roadName,
        neighborhood,
        startLat: 11.0090,
        startLng: 76.9460,
        endLat: 11.0110,
        endLng: 76.9480,
        description: 'Simulated infrastructure repair work blocking road.',
        active: true
      });
    }

    store.alerts.unshift({
      id: `ALT-${Date.now().toString().slice(-5)}`,
      severity: 'WARNING',
      title: 'Road Closure Warning',
      message: `${roadName} in ${neighborhood} closed to vehicle traffic. Rerouting required.`,
      timestamp: new Date().toISOString()
    });

    store.saveToDisk();

    return {
      message: `Road closure active on ${roadName} (${neighborhood}).`,
      closures: store.roadClosures
    };
  }

  // 6. Reset Simulation
  public static resetSimulation() {
    this.demoStepIndex = 0;
    // reset bins to normal levels
    store.bins.forEach((b, idx) => {
      b.fillLevel = 25 + (idx % 4) * 15;
      b.status = store.getBinStatus(b.fillLevel);
      b.priority = store.getPriority(b.status);
      b.estimatedOverflowRisk = Math.round((b.fillLevel / 100) * 100) / 100;
    });

    // reset trucks
    store.trucks.forEach(t => {
      t.status = 'IDLE';
      t.currentLoadKg = Math.floor(t.capacityKg * 0.2);
      t.assignedRouteId = null;
    });

    store.routes = [];
    store.trafficEvents.forEach(te => te.active = false);
    store.roadClosures.forEach(rc => rc.active = false);

    store.saveToDisk();

    return {
      message: 'Simulation state reset. All 50 bins set to normal levels. Trucks reset to depot.'
    };
  }

  // 7. Automated 1-Click DEMO MODE pipeline
  public static async executeDemoPipelineStep() {
    this.demoStepIndex++;
    const step = this.demoStepIndex % 6;

    switch (step) {
      case 1:
        // Step 1: Simulate critical overflow
        const overflow = this.simulateOverflow('BIN-005');
        return {
          stepNumber: 1,
          stepName: 'Critical Bin Overflow',
          description: 'BIN-005 in Gandhipuram reached 98% capacity.',
          detail: overflow.message
        };

      case 2:
        // Step 2: Bin Density Agent detection
        return {
          stepNumber: 2,
          stepName: 'Bin Density Agent Evaluation',
          description: 'Bin Density Agent flagged BIN-005 as URGENT priority.',
          detail: 'Status: CRITICAL (98%), Overflow Risk: 0.98. Logged agent event.'
        };

      case 3:
        // Step 3: Trigger Multi-Agent Route Optimization
        const wf = WorkflowOrchestrator.createWorkflow('Demo Pipeline Trigger');
        const orchState = await WorkflowOrchestrator.executeStep(wf.workflowId);
        const route0 = orchState.routes[0];
        return {
          stepNumber: 3,
          stepName: 'Multi-Agent Route Proposal',
          description: `Routing Agent generated proposed route for Truck TRK-01.`,
          detail: `Assigned critical bins. Route distance: ${route0?.totalDistanceKm || 12.4}km. Est time: ${route0?.estimatedTimeMin || 35} min.`
        };

      case 4:
        // Step 4: Dispatcher Approval Simulation
        if (store.routes.length > 0) {
          const targetRoute = store.routes[0];
          targetRoute.approvalStatus = 'APPROVED';
          const truck = store.trucks.find(t => t.truckId === targetRoute.truckId);
          if (truck) truck.status = 'IN_TRANSIT';
          store.saveToDisk();

          return {
            stepNumber: 4,
            stepName: 'Human Dispatcher Approval',
            description: `Dispatcher approved Route ${targetRoute.routeId} for Truck ${targetRoute.truckId}.`,
            detail: `Truck ${targetRoute.truckId} dispatched. Status updated to IN_TRANSIT.`
          };
        }
        return { stepNumber: 4, stepName: 'Human Approval', description: 'Route approval simulated.', detail: 'Approved' };

      case 5:
        // Step 5: Route Completion & Analytics Update
        if (store.routes.length > 0) {
          const targetRoute = store.routes[0];
          targetRoute.approvalStatus = 'COMPLETED';
          // Clear bins on route
          targetRoute.assignedBinIds.forEach(binId => {
            const bin = store.bins.find(b => b.binId === binId || b.id === binId);
            if (bin) {
              bin.fillLevel = 15;
              bin.status = 'EMPTY';
              bin.priority = 'LOW';
              bin.estimatedOverflowRisk = 0.15;
            }
          });
          const truck = store.trucks.find(t => t.truckId === targetRoute.truckId);
          if (truck) {
            truck.status = 'IDLE';
            truck.currentLoadKg = Math.min(truck.capacityKg, truck.currentLoadKg + 1200);
            truck.assignedRouteId = null;
          }
          store.saveToDisk();
        }
        return {
          stepNumber: 5,
          stepName: 'Route Execution Completed',
          description: 'Garbage truck completed collection. Bin levels emptied to 15%.',
          detail: 'Landfill diversion metrics updated. System returned to optimal state.'
        };

      case 0:
      default:
        // Step 6: Civic Campaign Publication
        const campaign = store.campaigns[0];
        return {
          stepNumber: 6,
          stepName: 'Civic Campaign Published',
          description: `Civic Campaign Agent published "${campaign?.titleEn || 'Zero Plastic Initiative'}" in English & Tamil.`,
          detail: `Campaign deployed to RS Puram target group. Expected impact: 32% landfill reduction.`
        };
    }
  }
}
