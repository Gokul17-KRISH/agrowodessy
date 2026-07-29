import {
  RecyclingInsightFinding,
  AgentMessage,
  WasteCompositionDetails
} from '../../src/types.js';
import { store } from '../db/store.js';

const AGENT_NAME = 'Recycling Intelligence & Analytics Agent';

export class RecyclingAnalyticsTools {
  public static getHistoricalWasteData(zone?: string, workflowId?: string) {
    const tStart = Date.now();
    const records = zone
      ? store.wasteHistory.filter(w => w.neighborhood === zone)
      : store.wasteHistory;

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'getHistoricalWasteData',
      arguments: { zone },
      resultSummary: `Retrieved ${records.length} historical waste records for analysis`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return records;
  }

  public static getZoneWasteData(zone: string, workflowId?: string) {
    const tStart = Date.now();
    const binsInZone = store.bins.filter(b => b.neighborhood === zone);
    const zoneHistory = store.wasteHistory.filter(w => w.neighborhood === zone);

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'getZoneWasteData',
      arguments: { zone },
      resultSummary: `Zone ${zone}: ${binsInZone.length} active bins, ${zoneHistory.length} historical logs`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return { binsInZone, zoneHistory };
  }

  public static calculateDiversionRate(recyclingTons: number, totalTons: number, workflowId?: string): number {
    const tStart = Date.now();
    const ratePct = totalTons > 0 ? Math.round((recyclingTons / totalTons) * 100) : 0;

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'calculateDiversionRate',
      arguments: { recyclingTons, totalTons },
      resultSummary: `Landfill diversion rate: ${ratePct}%`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return ratePct;
  }

  public static calculateContaminationRate(recyclingStreamTons: number, nonRecyclableItemsCount: number, workflowId?: string): number {
    const tStart = Date.now();
    const ratePct = Math.min(100, Math.round((nonRecyclableItemsCount / Math.max(1, recyclingStreamTons * 100)) * 100));

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'calculateContaminationRate',
      arguments: { recyclingStreamTons, nonRecyclableItemsCount },
      resultSummary: `Recycling stream contamination rate: ${ratePct}%`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return ratePct;
  }

  public static compareZones(workflowId?: string) {
    const tStart = Date.now();
    const zoneStats: Record<string, { totalTons: number; plasticPct: number; recyclingRate: number }> = {};

    store.wasteHistory.forEach(h => {
      if (!zoneStats[h.neighborhood]) {
        zoneStats[h.neighborhood] = { totalTons: 0, plasticPct: 0, recyclingRate: 0 };
      }
      zoneStats[h.neighborhood].totalTons += h.totalVolumeTons || 0;
      zoneStats[h.neighborhood].plasticPct = Math.round((zoneStats[h.neighborhood].plasticPct + (h.breakdown?.plastic || 30)) / 2);
      zoneStats[h.neighborhood].recyclingRate = Math.round((zoneStats[h.neighborhood].recyclingRate + (h.recyclingRatePct || 25)) / 2);
    });

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'compareZones',
      arguments: {},
      resultSummary: `Compared cross-zone profiles across ${Object.keys(zoneStats).length} municipal zones`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return zoneStats;
  }

  public static detectWasteAnomaly(
    zone: string,
    currentComposition?: WasteCompositionDetails,
    workflowId?: string
  ) {
    const tStart = Date.now();
    const zoneHist = store.wasteHistory.filter(w => w.neighborhood === zone);
    const avgPlastic = zoneHist.length > 0 ? Math.round(zoneHist.reduce((acc, h) => acc + (h.breakdown?.plastic || 30), 0) / zoneHist.length) : 34;
    const avgRecycling = zoneHist.length > 0 ? Math.round(zoneHist.reduce((acc, h) => acc + (h.recyclingRatePct || 25), 0) / zoneHist.length) : 28;

    const currentPlasticPct = currentComposition ? currentComposition.categoryPercentages.plastic : 51; // Ukkadam spike default
    const anomalyDelta = currentPlasticPct - avgPlastic;
    const isAnomaly = anomalyDelta >= 12;

    const result = {
      isAnomaly,
      zone,
      currentPlasticPct,
      historicalAvgPlastic: avgPlastic,
      historicalAvgRecycling: avgRecycling,
      anomalyDelta,
      issue: isAnomaly
        ? `Severe Plastic Packaging Anomaly detected in ${zone}: ${currentPlasticPct}% plastic vs historical ${avgPlastic}% (+${anomalyDelta}% spike)`
        : `Normal plastic distribution in ${zone}`
    };

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'detectWasteAnomaly',
      arguments: { zone, currentPlasticPct, historicalAvgPlastic: avgPlastic },
      resultSummary: result.issue,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return result;
  }

  public static calculateRecyclingOpportunity(zone: string, workflowId?: string) {
    const tStart = Date.now();
    const zoneHist = store.wasteHistory.filter(w => w.neighborhood === zone);
    const avgRecycling = zoneHist.length > 0 ? Math.round(zoneHist.reduce((acc, h) => acc + (h.recyclingRatePct || 25), 0) / zoneHist.length) : 25;
    const opportunityScore = Math.max(0, 100 - avgRecycling);

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'calculateRecyclingOpportunity',
      arguments: { zone, avgRecycling },
      resultSummary: `Recycling improvement opportunity score for ${zone}: ${opportunityScore}/100`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return opportunityScore;
  }
}

export async function processRecyclingAnalytics(zone = 'Ukkadam', compositionInput?: WasteCompositionDetails, workflowId?: string): Promise<RecyclingInsightFinding> {
  const startTime = Date.now();
  const wId = workflowId || `WF-${Date.now().toString().slice(-6)}`;

  // Step 1: Historical waste data tool
  RecyclingAnalyticsTools.getHistoricalWasteData(zone, wId);

  // Step 2: Zone comparison tool
  RecyclingAnalyticsTools.compareZones(wId);

  // Step 3: Anomaly detection tool
  const anomaly = RecyclingAnalyticsTools.detectWasteAnomaly(zone, compositionInput, wId);

  // Step 4: Recycling opportunity tool
  const oppScore = RecyclingAnalyticsTools.calculateRecyclingOpportunity(zone, wId);

  const finding: RecyclingInsightFinding = {
    zone,
    issue: `High Single-Use Plastic Packaging Contamination in ${zone}`,
    severity: anomaly.anomalyDelta >= 15 ? 'CRITICAL' : 'HIGH',
    evidence: {
      currentPlasticPercentage: anomaly.currentPlasticPct,
      historicalAverage: anomaly.historicalAvgPlastic,
      recyclingRatePct: anomaly.historicalAvgRecycling,
      contaminationRatePct: Math.round(anomaly.currentPlasticPct * 0.6),
      anomalyDelta: anomaly.anomalyDelta
    },
    recommendedAction: `Deploy targeted bilingual civic intervention campaign in ${zone} targeting commercial vendors & residents to reduce plastic bag contamination and enforce source segregation.`,
    decisionSummary: `Analytics Agent identified structural plastic waste anomaly in ${zone} (${anomaly.currentPlasticPct}% vs ${anomaly.historicalAvgPlastic}% baseline). Recommended immediate civic campaign dispatch to Civic Campaign Agent.`
  };

  const latencyMs = Date.now() - startTime;

  // Record Agent Event in Store
  store.agentEvents.unshift({
    id: `EVT-${Date.now().toString().slice(-6)}`,
    workflowId: wId,
    agentName: AGENT_NAME,
    eventType: 'RECYCLING_INSIGHT_GENERATED',
    inputSummary: `Cross-zone waste history analysis for ${zone}`,
    outputSummary: `Detected ${finding.severity} Plastic Spike in ${zone} (${anomaly.currentPlasticPct}% vs ${anomaly.historicalAvgPlastic}% avg)`,
    toolUsed: 'detectWasteAnomaly',
    reasoning: finding.decisionSummary,
    latencyMs,
    timestamp: new Date().toISOString(),
    status: 'WARNING'
  });

  // Emit Structured Message to Civic Campaign Agent / Orchestrator
  const message: AgentMessage = {
    id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    workflowId: wId,
    eventType: 'RECYCLING_INSIGHT_GENERATED',
    sourceAgent: AGENT_NAME,
    targetAgent: 'Civic Campaign & Engagement Agent',
    payload: finding,
    timestamp: new Date().toISOString()
  };
  store.agentMessages.unshift(message);

  // Update Agent Status
  const agtStatus = store.agentStatuses.find(a => a.name === AGENT_NAME);
  if (agtStatus) {
    agtStatus.lastAction = `Flagged plastic anomaly in ${zone}: ${anomaly.currentPlasticPct}% plastic`;
    agtStatus.latencyMs = latencyMs;
    agtStatus.eventsCount += 1;
    agtStatus.status = 'ACTIVE';
  }

  store.saveToDisk();

  return finding;
}
