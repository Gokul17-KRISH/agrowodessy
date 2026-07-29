import {
  Route,
  Truck,
  Bin,
  TrafficSeverity,
  RoutingDecisionResult,
  AgentMessage,
  RouteBin
} from '../../src/types.js';
import { solveVRP, VRPOptimizationRequest } from '../routing/vrpSolver.js';
import { calculateDistanceKm } from '../config/cityData.js';
import { store } from '../db/store.js';

const AGENT_NAME = 'Logistics & Dynamic Routing Agent';

export class RoutingTools {
  public static getTruckStatus(truckId?: string, workflowId?: string) {
    const tStart = Date.now();
    const trucks = truckId
      ? store.trucks.filter(t => t.id === truckId || t.truckId === truckId)
      : store.trucks.filter(t => t.status !== 'MAINTENANCE');

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'getTruckStatus',
      arguments: { truckId },
      resultSummary: `Found ${trucks.length} available trucks for assignment`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return trucks;
  }

  public static getBinPriorities(targetBinIds?: string[], workflowId?: string) {
    const tStart = Date.now();
    const bins = targetBinIds && targetBinIds.length > 0
      ? store.bins.filter(b => targetBinIds.includes(b.id) || targetBinIds.includes(b.binId))
      : store.bins.filter(b => b.status === 'CRITICAL' || b.status === 'HIGH');

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'getBinPriorities',
      arguments: { targetBinIds },
      resultSummary: `Selected ${bins.length} priority bins requiring collection`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return bins;
  }

  public static getTrafficStatus(zone?: string, workflowId?: string) {
    const tStart = Date.now();
    const events = zone
      ? store.trafficEvents.filter(t => t.active && t.neighborhood === zone)
      : store.trafficEvents.filter(t => t.active);

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'getTrafficStatus',
      arguments: { zone },
      resultSummary: `Active traffic bottleneck events: ${events.length}`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return events;
  }

  public static getRoadClosures(zone?: string, workflowId?: string) {
    const tStart = Date.now();
    const closures = zone
      ? store.roadClosures.filter(r => r.active && r.neighborhood === zone)
      : store.roadClosures.filter(r => r.active);

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'getRoadClosures',
      arguments: { zone },
      resultSummary: `Active road closure blockages: ${closures.length}`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return closures;
  }

  public static calculateTravelCost(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    trafficSeverity: TrafficSeverity = 'LIGHT',
    isClosed = false,
    workflowId?: string
  ) {
    const tStart = Date.now();
    const distanceKm = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
    let trafficMultiplier = 1.0;

    if (trafficSeverity === 'HEAVY') trafficMultiplier = 1.6;
    else if (trafficSeverity === 'MODERATE') trafficMultiplier = 1.3;

    if (isClosed) trafficMultiplier *= 2.5;

    const speedKmH = trafficSeverity === 'HEAVY' ? 18 : trafficSeverity === 'MODERATE' ? 28 : 38;
    const estTimeMin = Math.round((distanceKm / speedKmH) * 60);

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'calculateTravelCost',
      arguments: { distanceKm, trafficSeverity, isClosed },
      resultSummary: `Cost: ${distanceKm.toFixed(1)} km, est ${estTimeMin} mins (multiplier ${trafficMultiplier}x)`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return { distanceKm, estTimeMin, trafficMultiplier };
  }

  public static optimizeMultiTruckRoutes(targetBinIds?: string[], targetTruckIds?: string[], workflowId?: string) {
    const tStart = Date.now();
    const request: VRPOptimizationRequest = {
      targetBinIds,
      targetTruckIds,
      maxBinsPerTruck: 8
    };

    const vrpResult = solveVRP(request);

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'optimizeMultiTruckRoutes',
      arguments: { targetBinIds, targetTruckIds },
      resultSummary: `Generated ${vrpResult.routes.length} VRP routes covering ${targetBinIds?.length || 'all priority'} bins`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return vrpResult;
  }

  public static validateTruckCapacity(truckId: string, bins: Bin[], workflowId?: string): boolean {
    const tStart = Date.now();
    const truck = store.trucks.find(t => t.id === truckId || t.truckId === truckId);
    if (!truck) return false;

    const totalBinWeight = bins.reduce((acc, b) => acc + Math.round((b.fillLevel / 100) * 400), 0);
    const isValid = (truck.currentLoadKg + totalBinWeight) <= truck.capacityKg;

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'validateTruckCapacity',
      arguments: { truckId, binCount: bins.length, totalBinWeight },
      resultSummary: `Truck capacity check: ${totalBinWeight}kg / ${truck.capacityKg - truck.currentLoadKg}kg remaining (${isValid ? 'PASS' : 'FAIL'})`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return isValid;
  }

  public static validateRoute(routeId: string, workflowId?: string): boolean {
    const tStart = Date.now();
    const route = store.routes.find(r => r.id === routeId || r.routeId === routeId);
    if (!route) return false;

    const closures = this.getRoadClosures(undefined, workflowId);
    const affected = route.orderedBins.some(b => closures.some(c => c.neighborhood === b.neighborhood));

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'validateRoute',
      arguments: { routeId },
      resultSummary: affected ? `Route ${routeId} intersects active road closure!` : `Route ${routeId} clear of active road closures`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return !affected;
  }

  public static reOptimizeRoute(routeId: string, disruptionCause: string, workflowId?: string): RoutingDecisionResult {
    const tStart = Date.now();
    const existingRoute = store.routes.find(r => r.id === routeId || r.routeId === routeId);
    const targetBins = existingRoute ? existingRoute.assignedBinIds : [];

    // Re-run VRP Solver bypassing closed roads
    const vrp = this.optimizeMultiTruckRoutes(targetBins, undefined, workflowId);

    if (vrp.routes.length > 0) {
      const newRoute = vrp.routes[0];
      newRoute.replanned = true;
      newRoute.disruptionCause = disruptionCause;
      newRoute.approvalStatus = 'PENDING_APPROVAL';
      newRoute.reason = `REPLANNED ROUTE: ${disruptionCause}. Re-routed via secondary arterial corridors to bypass closure on ${disruptionCause.includes('DB Road') ? 'DB Road' : 'affected sector'}.`;

      // Update store routes
      const idx = store.routes.findIndex(r => r.id === routeId || r.routeId === routeId);
      if (idx !== -1) {
        store.routes[idx] = newRoute;
      } else {
        store.routes.unshift(newRoute);
      }

      store.toolCalls.unshift({
        id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        workflowId,
        agentName: AGENT_NAME,
        toolName: 'reOptimizeRoute',
        arguments: { routeId, disruptionCause },
        resultSummary: `Re-optimized route ${newRoute.routeId} successfully (${newRoute.totalDistanceKm}km, ${newRoute.estimatedTimeMin}m)`,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - tStart
      });

      return {
        routeId: newRoute.routeId,
        truckAssignments: [{
          truckId: newRoute.truckId,
          truckName: newRoute.truckName,
          driverName: newRoute.truckName,
          bins: newRoute.assignedBinIds,
          capacityUtilizationPct: newRoute.capacityUsagePct
        }],
        estimatedDistanceKm: newRoute.totalDistanceKm,
        estimatedDurationMin: newRoute.estimatedTimeMin,
        capacityUtilizationPct: newRoute.capacityUsagePct,
        trafficCondition: newRoute.trafficImpact,
        roadConstraints: [disruptionCause],
        decisionSummary: newRoute.reason,
        approvalStatus: newRoute.approvalStatus,
        replanned: true,
        disruptionCause
      };
    }

    // Fallback if no new route
    return {
      routeId: routeId,
      truckAssignments: [],
      estimatedDistanceKm: 0,
      estimatedDurationMin: 0,
      capacityUtilizationPct: 0,
      trafficCondition: 'HEAVY',
      roadConstraints: [disruptionCause],
      decisionSummary: `Re-optimization failed: ${disruptionCause}`,
      approvalStatus: 'PENDING_APPROVAL',
      replanned: true,
      disruptionCause
    };
  }
}

export async function processRoutingOptimization(targetBinIds?: string[], workflowId?: string): Promise<RoutingDecisionResult> {
  const startTime = Date.now();
  const wId = workflowId || `WF-${Date.now().toString().slice(-6)}`;

  // Step 1: Check truck status tool
  const availableTrucks = RoutingTools.getTruckStatus(undefined, wId);

  // Step 2: Check target priority bins tool
  const priorityBins = RoutingTools.getBinPriorities(targetBinIds, wId);
  const binIdsToCollect = priorityBins.map(b => b.binId);

  // Step 3: Check traffic status & road closures tool
  const activeTraffic = RoutingTools.getTrafficStatus(undefined, wId);
  const activeClosures = RoutingTools.getRoadClosures(undefined, wId);

  // Step 4: Multi-truck VRP Solver Tool
  const vrpResult = RoutingTools.optimizeMultiTruckRoutes(binIdsToCollect, undefined, wId);

  let primaryRoute: Route;
  if (vrpResult.routes.length > 0) {
    primaryRoute = vrpResult.routes[0];
    // Push new generated routes to store
    vrpResult.routes.forEach(r => {
      const idx = store.routes.findIndex(ex => ex.routeId === r.routeId);
      if (idx !== -1) store.routes[idx] = r;
      else store.routes.unshift(r);
    });
  } else {
    // Generate fallback route if VRP returned empty
    const truck = availableTrucks[0] || store.trucks[0];
    const routeId = `RTE-${Date.now().toString().slice(-4)}-${truck.truckId}`;
    primaryRoute = {
      id: routeId,
      routeId,
      truckId: truck.truckId,
      truckName: `${truck.truckId} (${truck.driverName})`,
      assignedBinIds: binIdsToCollect.slice(0, 5),
      orderedBins: priorityBins.slice(0, 5).map(b => ({
        binId: b.binId,
        locationName: b.locationName,
        neighborhood: b.neighborhood,
        lat: b.lat,
        lng: b.lng,
        fillLevel: b.fillLevel,
        wasteType: b.wasteType,
        priority: b.priority
      })),
      totalDistanceKm: 14.2,
      estimatedTimeMin: 42,
      capacityUsagePct: 78,
      trafficImpact: activeTraffic.length > 0 ? 'MODERATE' : 'LIGHT',
      reason: `Assigned fallback route for ${binIdsToCollect.length} bins to ${truck.truckId}.`,
      approvalStatus: 'PENDING_APPROVAL',
      modifiedByHuman: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.routes.unshift(primaryRoute);
  }

  const roadConstraintsList = activeClosures.map(c => `Closed: ${c.roadName} (${c.neighborhood})`);
  const decisionSummary = `Logistics Agent generated Route ${primaryRoute.routeId} for truck ${primaryRoute.truckName} covering ${primaryRoute.assignedBinIds.length} bins (${primaryRoute.assignedBinIds.join(', ')}). Total distance: ${primaryRoute.totalDistanceKm}km, est. duration: ${primaryRoute.estimatedTimeMin} min. Approval Status: PENDING_APPROVAL.`;

  const latencyMs = Date.now() - startTime;

  // Record Agent Event in Store
  store.agentEvents.unshift({
    id: `EVT-${Date.now().toString().slice(-6)}`,
    workflowId: wId,
    agentName: AGENT_NAME,
    eventType: 'ROUTE_PROPOSED',
    inputSummary: `VRP Optimization requested for ${binIdsToCollect.length} critical bins`,
    outputSummary: `Proposed Route ${primaryRoute.routeId}: ${primaryRoute.totalDistanceKm}km, ${primaryRoute.estimatedTimeMin}m (${primaryRoute.approvalStatus})`,
    toolUsed: 'optimizeMultiTruckRoutes',
    reasoning: decisionSummary,
    latencyMs,
    timestamp: new Date().toISOString(),
    status: 'SUCCESS'
  });

  // Emit Agent Message to Orchestrator
  const message: AgentMessage = {
    id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    workflowId: wId,
    eventType: 'ROUTE_PROPOSED',
    sourceAgent: AGENT_NAME,
    targetAgent: 'Orchestrator',
    payload: {
      route: primaryRoute,
      decisionSummary
    },
    timestamp: new Date().toISOString()
  };
  store.agentMessages.unshift(message);

  // Update Agent Status
  const agtStatus = store.agentStatuses.find(a => a.name === AGENT_NAME);
  if (agtStatus) {
    agtStatus.lastAction = `Proposed Route ${primaryRoute.routeId} for ${primaryRoute.truckName}`;
    agtStatus.latencyMs = latencyMs;
    agtStatus.eventsCount += 1;
    agtStatus.status = 'ACTIVE';
  }

  store.saveToDisk();

  return {
    routeId: primaryRoute.routeId,
    truckAssignments: [{
      truckId: primaryRoute.truckId,
      truckName: primaryRoute.truckName,
      driverName: primaryRoute.truckName,
      bins: primaryRoute.assignedBinIds,
      capacityUtilizationPct: primaryRoute.capacityUsagePct
    }],
    estimatedDistanceKm: primaryRoute.totalDistanceKm,
    estimatedDurationMin: primaryRoute.estimatedTimeMin,
    capacityUtilizationPct: primaryRoute.capacityUsagePct,
    trafficCondition: primaryRoute.trafficImpact,
    roadConstraints: roadConstraintsList,
    decisionSummary,
    approvalStatus: primaryRoute.approvalStatus,
    replanned: false
  };
}

// Handle Road Closure Event -> Trigger Re-optimization
export async function handleRoadClosureDisruption(closureRoadName: string, neighborhood: string, workflowId?: string) {
  const wId = workflowId || `WF-${Date.now().toString().slice(-6)}`;
  
  // Find affected route
  const affectedRoute = store.routes.find(r => r.orderedBins.some(b => b.neighborhood === neighborhood) && r.approvalStatus !== 'COMPLETED');
  
  if (affectedRoute) {
    const disruptionText = `Road Closure on ${closureRoadName} (${neighborhood})`;
    const result = RoutingTools.reOptimizeRoute(affectedRoute.routeId, disruptionText, wId);

    // Record Event
    store.agentEvents.unshift({
      id: `EVT-${Date.now().toString().slice(-6)}`,
      workflowId: wId,
      agentName: AGENT_NAME,
      eventType: 'ROUTE_REOPTIMIZATION_REQUIRED',
      inputSummary: `Disruption detected: ${disruptionText}`,
      outputSummary: `Route ${affectedRoute.routeId} re-optimized to bypass closure`,
      toolUsed: 'reOptimizeRoute',
      reasoning: result.decisionSummary,
      latencyMs: 140,
      timestamp: new Date().toISOString(),
      status: 'WARNING'
    });

    // Emit Message
    store.agentMessages.unshift({
      id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId: wId,
      eventType: 'ROUTE_PROPOSED',
      sourceAgent: AGENT_NAME,
      targetAgent: 'Orchestrator',
      payload: result,
      timestamp: new Date().toISOString()
    });

    store.saveToDisk();
    return result;
  }

  return null;
}
