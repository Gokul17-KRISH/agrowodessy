import { GoogleGenAI } from '@google/genai';
import {
  Bin,
  BinStatus,
  PriorityLevel,
  WasteObservationInput,
  WasteCompositionDetails,
  BinAnalysisResult,
  DensityClassification,
  PriorityCode,
  AgentMessage,
  ToolCallLog
} from '../../src/types.js';
import { store } from '../db/store.js';

const AGENT_NAME = 'Bin Density & Waste Composition Agent';

// Explicit Agent Tools
export class BinDensityTools {
  public static getBinObservation(binId: string, workflowId?: string) {
    const tStart = Date.now();
    const bin = store.bins.find(b => b.id === binId || b.binId === binId);
    
    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'getBinObservation',
      arguments: { binId },
      resultSummary: bin ? `Retrieved sensor data for ${bin.binId} in ${bin.neighborhood}` : `Bin ${binId} not found`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return bin;
  }

  public static getBinHistory(binId: string, workflowId?: string) {
    const tStart = Date.now();
    const bin = this.getBinObservation(binId, workflowId);
    const history = bin ? bin.historicalReadings || [] : [];

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'getBinHistory',
      arguments: { binId },
      resultSummary: `Retrieved ${history.length} historical readings`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return history;
  }

  public static analyzeWasteComposition(obs?: WasteObservationInput['wasteObservation'], workflowId?: string): WasteCompositionDetails {
    const tStart = Date.now();

    const plasticBottles = obs?.plasticBottles ?? Math.floor(10 + Math.random() * 25);
    const plasticCovers = obs?.plasticCovers ?? Math.floor(15 + Math.random() * 30);
    const glassBottles = obs?.glassBottles ?? Math.floor(2 + Math.random() * 12);
    const metalCans = obs?.metalCans ?? Math.floor(3 + Math.random() * 15);
    const aluminumContainers = obs?.aluminumContainers ?? Math.floor(1 + Math.random() * 8);
    const paper = obs?.paper ?? Math.floor(5 + Math.random() * 20);
    const cardboard = obs?.cardboard ?? Math.floor(5 + Math.random() * 20);
    const organicWaste = obs?.organicWaste ?? Math.floor(15 + Math.random() * 40);
    const eWaste = obs?.eWaste ?? Math.floor(0 + Math.random() * 3);
    const other = obs?.other ?? Math.floor(2 + Math.random() * 10);

    const totalItemCount = plasticBottles + plasticCovers + glassBottles + metalCans + aluminumContainers + paper + cardboard + organicWaste + eWaste + other;

    const plasticItems = plasticBottles + plasticCovers;
    const glassItems = glassBottles;
    const metalItems = metalCans + aluminumContainers;
    const paperItems = paper + cardboard;
    const organicItems = organicWaste;
    const otherItems = eWaste + other;

    const categoryPercentages = {
      plastic: Math.round((plasticItems / totalItemCount) * 100),
      glass: Math.round((glassItems / totalItemCount) * 100),
      metal: Math.round((metalItems / totalItemCount) * 100),
      paperCardboard: Math.round((paperItems / totalItemCount) * 100),
      organic: Math.round((organicItems / totalItemCount) * 100),
      other: Math.round((otherItems / totalItemCount) * 100)
    };

    let dominantCategory = 'Plastic';
    let maxPct = categoryPercentages.plastic;
    if (categoryPercentages.organic > maxPct) { dominantCategory = 'Organic'; maxPct = categoryPercentages.organic; }
    if (categoryPercentages.paperCardboard > maxPct) { dominantCategory = 'Paper & Cardboard'; maxPct = categoryPercentages.paperCardboard; }
    if (categoryPercentages.glass > maxPct) { dominantCategory = 'Glass'; maxPct = categoryPercentages.glass; }
    if (categoryPercentages.metal > maxPct) { dominantCategory = 'Metal'; maxPct = categoryPercentages.metal; }

    const recyclableItems = plasticBottles + glassBottles + metalCans + aluminumContainers + paper + cardboard;
    const recyclablePercentage = Math.round((recyclableItems / totalItemCount) * 100);
    const organicPercentage = categoryPercentages.organic;
    // Contamination percentage = proportion of unsegregated non-recyclables mixed in recyclables
    const contaminationPercentage = Math.min(100, Math.round(((plasticCovers + organicWaste + other) / totalItemCount) * 100));

    const result: WasteCompositionDetails = {
      plasticBottles,
      plasticCovers,
      glassBottles,
      metalCans,
      aluminumContainers,
      paper,
      cardboard,
      organicWaste,
      eWaste,
      other,
      totalItemCount,
      categoryPercentages,
      dominantCategory,
      recyclablePercentage,
      organicPercentage,
      contaminationPercentage
    };

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'analyzeWasteComposition',
      arguments: { totalItems: totalItemCount },
      resultSummary: `Dominant: ${dominantCategory} (${maxPct}%) | Recyclable: ${recyclablePercentage}% | Contamination: ${contaminationPercentage}%`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return result;
  }

  public static calculateWasteDensity(fillPercentage: number, capacityKg: number, estimatedWeightKg?: number, workflowId?: string): DensityClassification {
    const tStart = Date.now();
    let density: DensityClassification = 'NORMAL';

    const weightRatio = estimatedWeightKg ? estimatedWeightKg / capacityKg : fillPercentage / 100;

    if (fillPercentage >= 95 || weightRatio >= 0.92) density = 'CRITICAL';
    else if (fillPercentage >= 80 || weightRatio >= 0.78) density = 'HIGH';
    else if (fillPercentage >= 60 || weightRatio >= 0.58) density = 'MEDIUM';
    else if (fillPercentage >= 30) density = 'NORMAL';
    else if (fillPercentage >= 10) density = 'LOW';
    else density = 'EMPTY';

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'calculateWasteDensity',
      arguments: { fillPercentage, capacityKg, estimatedWeightKg },
      resultSummary: `Density classified as ${density}`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return density;
  }

  public static calculateFillRate(currentFill: number, previousFill = 50, deltaTimeHours = 2, workflowId?: string): number {
    const tStart = Date.now();
    const rate = Math.max(0.5, Math.round(((currentFill - previousFill) / Math.max(0.25, deltaTimeHours)) * 10) / 10);

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'calculateFillRate',
      arguments: { currentFill, previousFill, deltaTimeHours },
      resultSummary: `Fill rate: ${rate}% per hour`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return rate;
  }

  public static predictOverflowRisk(fillPercentage: number, fillRatePctPerHour: number, density: DensityClassification, workflowId?: string) {
    const tStart = Date.now();
    const remainingPct = Math.max(0, 100 - fillPercentage);
    const hoursToOverflow = fillRatePctPerHour > 0 ? Math.round((remainingPct / fillRatePctPerHour) * 10) / 10 : 99;

    let riskScore = Math.min(100, Math.round((fillPercentage * 0.7) + (fillRatePctPerHour * 4) + (density === 'CRITICAL' ? 25 : density === 'HIGH' ? 15 : 0)));
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    if (riskScore >= 85 || fillPercentage >= 95) riskLevel = 'CRITICAL';
    else if (riskScore >= 65 || fillPercentage >= 80) riskLevel = 'HIGH';
    else if (riskScore >= 40) riskLevel = 'MEDIUM';

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'predictOverflowRisk',
      arguments: { fillPercentage, fillRatePctPerHour, density },
      resultSummary: `Overflow Risk Score: ${riskScore} (${riskLevel}) | Time to overflow: ~${hoursToOverflow} hrs`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return { hoursToOverflow, riskScore, riskLevel };
  }

  public static calculateCollectionPriority(overflowRiskScore: number, fillPercentage: number, zoneSensitivity: number, workflowId?: string): PriorityCode {
    const tStart = Date.now();
    let priority: PriorityCode = 'P5';

    const composite = (overflowRiskScore * 0.6) + (fillPercentage * 0.3) + (zoneSensitivity * 10);

    if (composite >= 85 || fillPercentage >= 95) priority = 'P1';
    else if (composite >= 70 || fillPercentage >= 80) priority = 'P2';
    else if (composite >= 50) priority = 'P3';
    else if (composite >= 30) priority = 'P4';

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'calculateCollectionPriority',
      arguments: { overflowRiskScore, fillPercentage, zoneSensitivity },
      resultSummary: `Collection Priority assigned: ${priority}`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return priority;
  }

  public static getZoneSensitivity(zone: string, workflowId?: string): number {
    const tStart = Date.now();
    const sensitiveZones: Record<string, number> = {
      'Gandhipuram': 1.5, // High commercial density & bus terminals
      'Ukkadam': 1.4,     // Dense market area
      'RS Puram': 1.3,    // Shopping district
      'Saibaba Colony': 1.1,
      'Peelamedu': 1.2,
      'Singanallur': 1.0
    };

    const sensitivity = sensitiveZones[zone] || 1.0;

    store.toolCalls.unshift({
      id: `TCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workflowId,
      agentName: AGENT_NAME,
      toolName: 'getZoneSensitivity',
      arguments: { zone },
      resultSummary: `Zone sensitivity for ${zone}: ${sensitivity}x`,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - tStart
    });

    return sensitivity;
  }
}

export async function processBinDensityAnalysis(input: WasteObservationInput, workflowId?: string): Promise<BinAnalysisResult> {
  const startTime = Date.now();
  const wId = workflowId || `WF-${Date.now().toString().slice(-6)}`;

  // Step 1: Get bin observation via Tool
  const existingBin = BinDensityTools.getBinObservation(input.binId, wId);
  const zone = input.zone || existingBin?.neighborhood || 'Gandhipuram';
  const capacityKg = input.capacityKg || 1000;
  const fillLevel = input.fillPercentage !== undefined ? input.fillPercentage : (existingBin ? existingBin.fillLevel : 85);
  
  let reasoningFromCV = '';

  // Optional Gemini vision analysis if image description provided
  if (input.imageDescription && process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `You are an AI Vision Waste Analyzer for Municipal WasteWise System.
Analyze observation: "${input.imageDescription}".
Return JSON strictly:
{
  "estimatedFillLevel": number (0-100),
  "dominantCategory": "plastic" | "glass" | "organic" | "metal" | "paper",
  "visualNotes": "concise observation"
}`
      });

      const text = response.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        reasoningFromCV = `Visual CV Note: ${parsed.visualNotes || 'Visual inspection complete'}.`;
      }
    } catch (e) {
      console.warn('[BinDensityAgent] Gemini CV fallback:', e);
    }
  }

  // Step 2: Waste Composition Analysis Tool
  const composition = BinDensityTools.analyzeWasteComposition(input.wasteObservation, wId);

  // Step 3: Density Analysis Tool
  const estimatedWeightKg = input.estimatedWeightKg || Math.round((fillLevel / 100) * capacityKg * 0.85);
  const estimatedVolumeM3 = input.estimatedVolumeM3 || Math.round((fillLevel / 100) * 1.2 * 100) / 100;
  const density = BinDensityTools.calculateWasteDensity(fillLevel, capacityKg, estimatedWeightKg, wId);

  // Step 4: Fill Rate & Overflow Risk Tool
  const fillRatePctPerHour = BinDensityTools.calculateFillRate(fillLevel, input.previousFillPercentage || (fillLevel - 8), 2, wId);
  const overflowRisk = BinDensityTools.predictOverflowRisk(fillLevel, fillRatePctPerHour, density, wId);

  // Step 5: Zone Sensitivity & Priority Tool
  const zoneSensitivity = BinDensityTools.getZoneSensitivity(zone, wId);
  const priority = BinDensityTools.calculateCollectionPriority(overflowRisk.riskScore, fillLevel, zoneSensitivity, wId);

  const binId = input.binId;
  const decisionSummary = `Bin ${binId} in ${zone} is at ${fillLevel}% capacity (${density} density, ${estimatedWeightKg}kg). Dominant waste: ${composition.dominantCategory} (${composition.categoryPercentages.plastic}% plastic, ${composition.contaminationPercentage}% contamination). Overflow risk score is ${overflowRisk.riskScore}/100 (~${overflowRisk.hoursToOverflow}h remaining). Assigned priority ${priority}. ${reasoningFromCV}`.trim();

  const decision = priority === 'P1' || priority === 'P2' ? 'Immediate collection recommended.' : 'Schedule routine collection window.';
  const nextAction = priority === 'P1' || priority === 'P2' ? 'Send critical-bin event to Orchestrator.' : 'Monitor fill rate trend.';

  // Update store bin record
  if (existingBin) {
    existingBin.fillLevel = fillLevel;
    existingBin.status = fillLevel >= 95 ? 'CRITICAL' : fillLevel >= 80 ? 'HIGH' : fillLevel >= 60 ? 'MEDIUM' : fillLevel >= 30 ? 'NORMAL' : 'EMPTY';
    existingBin.priority = priority === 'P1' ? 'URGENT' : priority === 'P2' ? 'HIGH' : priority === 'P3' ? 'NORMAL' : 'LOW';
    existingBin.estimatedOverflowRisk = overflowRisk.riskScore / 100;
    existingBin.lastUpdated = new Date().toISOString();
    existingBin.historicalReadings.push({
      timestamp: new Date().toISOString(),
      fillLevel
    });
    if (existingBin.historicalReadings.length > 20) existingBin.historicalReadings.shift();
  }

  const result: BinAnalysisResult = {
    binId,
    zone,
    timestamp: new Date().toISOString(),
    fillLevel,
    density,
    capacityKg,
    estimatedVolumeM3,
    estimatedWeightKg,
    fillRatePctPerHour,
    estimatedTimeToOverflowHours: overflowRisk.hoursToOverflow,
    overflowRiskScore: overflowRisk.riskScore,
    overflowRiskLevel: overflowRisk.riskLevel,
    priority,
    composition,
    decision,
    decisionSummary,
    nextAction
  };

  const latencyMs = Date.now() - startTime;

  // Record Agent Event in Store
  store.agentEvents.unshift({
    id: `EVT-${Date.now().toString().slice(-6)}`,
    workflowId: wId,
    agentName: AGENT_NAME,
    eventType: 'BIN_ANALYSIS_COMPLETED',
    inputSummary: `Observation for Bin ${binId} (${zone}): ${fillLevel}% fill`,
    outputSummary: `Density: ${density} | Priority: ${priority} | Overflow Risk: ${overflowRisk.riskScore}/100`,
    toolUsed: 'analyzeWasteComposition',
    reasoning: decisionSummary,
    latencyMs,
    timestamp: new Date().toISOString(),
    status: priority === 'P1' ? 'WARNING' : 'SUCCESS'
  });

  // Emit Structured Agent Message to Orchestrator
  const msgType = (priority === 'P1' || fillLevel >= 90) ? 'BIN_CRITICAL_DETECTED' : 'BIN_ANALYSIS_COMPLETED';
  const message: AgentMessage = {
    id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    workflowId: wId,
    eventType: msgType,
    sourceAgent: AGENT_NAME,
    targetAgent: 'Orchestrator',
    payload: result,
    timestamp: new Date().toISOString()
  };
  store.agentMessages.unshift(message);

  if (msgType === 'BIN_CRITICAL_DETECTED') {
    store.alerts.unshift({
      id: `ALT-${Date.now().toString().slice(-5)}`,
      severity: 'CRITICAL',
      title: 'Critical Bin Density Alert',
      message: `Bin ${binId} in ${zone} reached CRITICAL ${fillLevel}% capacity (${density} density).`,
      timestamp: new Date().toISOString(),
      entityId: binId,
      entityType: 'bin'
    });
  }

  // Update Agent Status in Store
  const agtStatus = store.agentStatuses.find(a => a.name === AGENT_NAME);
  if (agtStatus) {
    agtStatus.lastAction = `Analyzed Bin ${binId}: ${density} density, ${priority} priority`;
    agtStatus.latencyMs = latencyMs;
    agtStatus.eventsCount += 1;
    agtStatus.status = 'ACTIVE';
  }

  store.saveToDisk();

  return result;
}
