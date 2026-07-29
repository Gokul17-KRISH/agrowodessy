import { Bin, Truck, Route, RouteBin, TrafficSeverity } from '../../src/types.js';
import { calculateDistanceKm } from '../config/cityData.js';
import { store } from '../db/store.js';

export interface VRPOptimizationRequest {
  targetBinIds?: string[]; // Bins needing collection, if empty auto-picks HIGH/CRITICAL bins
  targetTruckIds?: string[]; // Specific trucks or auto-select available trucks
  maxBinsPerTruck?: number;
}

export interface VRPOptimizationResult {
  routes: Route[];
  unassignedBins: string[];
  totalDistanceKm: number;
  totalTimeMin: number;
  reasoning: string[];
}

export function solveVRP(request: VRPOptimizationRequest): VRPOptimizationResult {
  const allBins = store.bins;
  const allTrucks = store.trucks;
  const activeRoadClosures = store.roadClosures.filter(rc => rc.active);
  const activeTraffic = store.trafficEvents.filter(te => te.active);

  // 1. Determine bins needing collection
  let candidateBins: Bin[] = [];
  if (request.targetBinIds && request.targetBinIds.length > 0) {
    candidateBins = allBins.filter(b => request.targetBinIds!.includes(b.id) || request.targetBinIds!.includes(b.binId));
  } else {
    // Collect all CRITICAL (96-100%) and HIGH (81-95%) bins, plus MEDIUM bins if nearby
    candidateBins = allBins.filter(b => b.status === 'CRITICAL' || b.status === 'HIGH');
    if (candidateBins.length < 3) {
      const mediumBins = allBins.filter(b => b.status === 'MEDIUM');
      candidateBins = [...candidateBins, ...mediumBins.slice(0, 5 - candidateBins.length)];
    }
  }

  if (candidateBins.length === 0) {
    return {
      routes: [],
      unassignedBins: [],
      totalDistanceKm: 0,
      totalTimeMin: 0,
      reasoning: ['No bins currently exceed collection thresholds (CRITICAL or HIGH). System operating in normal state.']
    };
  }

  // Sort candidate bins by priority (CRITICAL > HIGH > MEDIUM) and fill level descending
  candidateBins.sort((a, b) => {
    if (a.status === 'CRITICAL' && b.status !== 'CRITICAL') return -1;
    if (b.status === 'CRITICAL' && a.status !== 'CRITICAL') return 1;
    return b.fillLevel - a.fillLevel;
  });

  // 2. Select eligible trucks
  let availableTrucks: Truck[] = [];
  if (request.targetTruckIds && request.targetTruckIds.length > 0) {
    availableTrucks = allTrucks.filter(t => request.targetTruckIds!.includes(t.id) || request.targetTruckIds!.includes(t.truckId));
  } else {
    availableTrucks = allTrucks.filter(t => (t.capacityKg - t.currentLoadKg) >= 800 && t.status !== 'MAINTENANCE');
  }

  if (availableTrucks.length === 0) {
    return {
      routes: [],
      unassignedBins: candidateBins.map(b => b.binId),
      totalDistanceKm: 0,
      totalTimeMin: 0,
      reasoning: ['No available garbage trucks with sufficient remaining capacity.']
    };
  }

  const generatedRoutes: Route[] = [];
  const unassignedBins: string[] = [];
  const reasoningLogs: string[] = [];
  let aggregateDistance = 0;
  let aggregateTime = 0;

  const maxBinsLimit = request.maxBinsPerTruck || 8;
  const remainingCandidateBins = [...candidateBins];

  // Estimate waste weight per bin: 100% full bin ~ 400kg
  const getBinWeightKg = (b: Bin) => Math.round((b.fillLevel / 100) * 400);

  // 3. Multi-truck assignment loop
  for (const truck of availableTrucks) {
    if (remainingCandidateBins.length === 0) break;

    const availableCapacity = truck.capacityKg - truck.currentLoadKg;
    let truckCurrentLoad = 0;
    let currentLat = truck.currentLat;
    let currentLng = truck.currentLng;

    const routeBins: RouteBin[] = [];
    const assignedBinIds: string[] = [];

    // Nearest Neighbor + Capacity Greedy Selection
    while (remainingCandidateBins.length > 0 && routeBins.length < maxBinsLimit) {
      let bestIndex = -1;
      let bestScore = Infinity;

      for (let i = 0; i < remainingCandidateBins.length; i++) {
        const bin = remainingCandidateBins[i];
        const estWeight = getBinWeightKg(bin);

        if (truckCurrentLoad + estWeight > availableCapacity) {
          continue; // exceeds truck capacity
        }

        const dist = calculateDistanceKm(currentLat, currentLng, bin.lat, bin.lng);
        
        // Traffic penalty factor
        let trafficMultiplier = 1.0;
        const matchingTraffic = activeTraffic.find(t => t.neighborhood === bin.neighborhood);
        if (matchingTraffic) {
          if (matchingTraffic.severity === 'HEAVY') trafficMultiplier = 1.6;
          else if (matchingTraffic.severity === 'MODERATE') trafficMultiplier = 1.3;
        }

        // Road closure check: if bin is in a closed zone, penalize
        const isClosed = activeRoadClosures.some(rc => rc.neighborhood === bin.neighborhood);
        if (isClosed) {
          trafficMultiplier *= 2.0;
        }

        // Priority score discount (prefer critical bins even if slightly farther)
        const priorityBonus = bin.status === 'CRITICAL' ? 0.4 : bin.status === 'HIGH' ? 0.7 : 1.0;
        const compositeScore = dist * trafficMultiplier * priorityBonus;

        if (compositeScore < bestScore) {
          bestScore = compositeScore;
          bestIndex = i;
        }
      }

      if (bestIndex === -1) {
        // Truck capacity reached or remaining bins too heavy
        break;
      }

      const selectedBin = remainingCandidateBins.splice(bestIndex, 1)[0];
      const estWeight = getBinWeightKg(selectedBin);

      truckCurrentLoad += estWeight;
      currentLat = selectedBin.lat;
      currentLng = selectedBin.lng;

      routeBins.push({
        binId: selectedBin.binId,
        locationName: selectedBin.locationName,
        neighborhood: selectedBin.neighborhood,
        lat: selectedBin.lat,
        lng: selectedBin.lng,
        fillLevel: selectedBin.fillLevel,
        wasteType: selectedBin.wasteType,
        priority: selectedBin.priority
      });
      assignedBinIds.push(selectedBin.binId);
    }

    if (routeBins.length > 0) {
      // Calculate total route distance
      let totalDist = calculateDistanceKm(truck.currentLat, truck.currentLng, routeBins[0].lat, routeBins[0].lng);
      for (let i = 0; i < routeBins.length - 1; i++) {
        totalDist += calculateDistanceKm(routeBins[i].lat, routeBins[i].lng, routeBins[i + 1].lat, routeBins[i + 1].lng);
      }
      totalDist = Math.round(totalDist * 10) / 10;

      // Calculate traffic impact & estimated time
      const primaryNeighborhood = routeBins[0].neighborhood;
      const traffic = activeTraffic.find(t => t.neighborhood === primaryNeighborhood);
      let trafficImpact: TrafficSeverity = traffic ? traffic.severity : 'LIGHT';
      if (activeRoadClosures.some(rc => rc.neighborhood === primaryNeighborhood)) {
        trafficImpact = 'HEAVY';
      }

      const speedKmH = trafficImpact === 'HEAVY' ? 18 : trafficImpact === 'MODERATE' ? 28 : 38;
      const collectionTimePerBin = 3; // 3 mins per bin
      const estTimeMin = Math.round((totalDist / speedKmH) * 60 + routeBins.length * collectionTimePerBin);

      const capacityUsagePct = Math.round(((truck.currentLoadKg + truckCurrentLoad) / truck.capacityKg) * 100);

      const routeId = `RTE-${Date.now().toString().slice(-4)}-${truck.truckId}`;

      const reason = `Assigned ${routeBins.length} bins (${routeBins.map(b => b.binId).join(', ')}) in ${primaryNeighborhood} to ${truck.truckId} (${truck.driverName}). Route prioritizes critical fill levels while bypassing ${activeRoadClosures.length > 0 ? activeRoadClosures[0].roadName : 'traffic bottlenecks'}.`;

      reasoningLogs.push(reason);

      const newRoute: Route = {
        id: routeId,
        routeId,
        truckId: truck.truckId,
        truckName: `${truck.truckId} (${truck.driverName})`,
        assignedBinIds,
        orderedBins: routeBins,
        totalDistanceKm: totalDist,
        estimatedTimeMin: estTimeMin,
        capacityUsagePct,
        trafficImpact,
        reason,
        approvalStatus: 'PENDING_APPROVAL',
        modifiedByHuman: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      generatedRoutes.push(newRoute);
      aggregateDistance += totalDist;
      aggregateTime += estTimeMin;
    }
  }

  // Any left-over bins
  if (remainingCandidateBins.length > 0) {
    remainingCandidateBins.forEach(b => unassignedBins.push(b.binId));
    reasoningLogs.push(`${remainingCandidateBins.length} bins remain unassigned due to truck capacity or shift limits.`);
  }

  return {
    routes: generatedRoutes,
    unassignedBins,
    totalDistanceKm: Math.round(aggregateDistance * 10) / 10,
    totalTimeMin: aggregateTime,
    reasoning: reasoningLogs
  };
}
