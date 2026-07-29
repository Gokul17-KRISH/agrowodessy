import {
  SharedWorkflowState,
  AgentMessage,
  WasteObservationInput,
  RouteApprovalStatus,
  AgentName
} from '../../src/types.js';
import { processBinDensityAnalysis } from '../agents/binDensityAgent.js';
import { processRoutingOptimization, handleRoadClosureDisruption } from '../agents/routingAgent.js';
import { processRecyclingAnalytics } from '../agents/analyticsAgent.js';
import { processCampaignGeneration } from '../agents/campaignAgent.js';
import { store } from '../db/store.js';

const ORCHESTRATOR_NAME = 'Orchestrator';

export class WorkflowOrchestrator {
  public static createWorkflow(triggerReason = 'Manual Simulation Trigger'): SharedWorkflowState {
    const workflowId = `WF-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    const state: SharedWorkflowState = {
      workflowId,
      timestamp: nowIso,
      trigger: triggerReason,
      currentAgent: 'Bin Density & Waste Composition Agent',
      workflowStatus: 'INITIATED',
      binAnalysis: null,
      wasteComposition: null,
      criticalBins: [],
      truckStatus: [...store.trucks],
      traffic: [...store.trafficEvents.filter(t => t.active)],
      roadClosures: [...store.roadClosures.filter(r => r.active)],
      routes: [],
      analyticsFindings: null,
      campaign: null,
      agentMessages: [],
      toolCalls: [],
      humanApprovals: [],
      errors: [],
      timestamps: {
        initiatedAt: nowIso
      }
    };

    store.workflowRuns.unshift(state);
    if (store.workflowRuns.length > 20) store.workflowRuns.pop();

    store.agentEvents.unshift({
      id: `EVT-${Date.now().toString().slice(-6)}`,
      workflowId,
      agentName: ORCHESTRATOR_NAME,
      eventType: 'WORKFLOW_INITIATED',
      inputSummary: `Workflow ${workflowId} initialized: ${triggerReason}`,
      outputSummary: `Orchestrator dispatching Agent 1 (Bin Density & Waste Composition)`,
      toolUsed: 'orchestratePipeline',
      reasoning: `Central Orchestrator initiated stateful 4-agent workflow ${workflowId} to process ${triggerReason}.`,
      latencyMs: 15,
      timestamp: nowIso,
      status: 'SUCCESS'
    });

    store.saveToDisk();
    return state;
  }

  public static async executeStep(workflowId: string, customBinInput?: WasteObservationInput): Promise<SharedWorkflowState> {
    let state = store.workflowRuns.find(w => w.workflowId === workflowId);
    if (!state) {
      state = this.createWorkflow('Auto-created Workflow');
    }

    state.workflowStatus = 'PROCESSING';
    state.timestamps.processingStartedAt = new Date().toISOString();

    try {
      // Step 1: Agent 1 - Bin Density & Waste Composition Analysis
      state.currentAgent = 'Bin Density & Waste Composition Agent';
      const obsInput: WasteObservationInput = customBinInput || {
        binId: 'BIN-005',
        zone: 'Gandhipuram',
        fillPercentage: 98,
        capacityKg: 1000,
        estimatedWeightKg: 890,
        wasteObservation: {
          plasticBottles: 35,
          plasticCovers: 42,
          glassBottles: 8,
          metalCans: 12,
          aluminumContainers: 6,
          paper: 15,
          cardboard: 18,
          organicWaste: 25,
          eWaste: 2,
          other: 5
        },
        imageDescription: 'Bin BIN-005 overflowing with single-use plastic takeaway containers and beverage bottles at Gandhipuram Bus Stand.'
      };

      const binResult = await processBinDensityAnalysis(obsInput, workflowId);
      state.binAnalysis = binResult;
      state.wasteComposition = binResult.composition;
      state.criticalBins = [binResult.binId];
      state.timestamps.binAnalysisCompletedAt = new Date().toISOString();

      // Step 2: Agent 2 - Logistics & Dynamic Routing Optimization
      state.currentAgent = 'Logistics & Dynamic Routing Agent';
      const routingResult = await processRoutingOptimization(state.criticalBins, workflowId);
      state.routes = [...store.routes.filter(r => r.routeId === routingResult.routeId)];
      state.timestamps.routingProposedAt = new Date().toISOString();

      // Set workflow status to awaiting human approval for route
      state.workflowStatus = 'AWAITING_HUMAN_APPROVAL';

      // Step 3: Agent 3 - Recycling Intelligence & Analytics
      state.currentAgent = 'Recycling Intelligence & Analytics Agent';
      const analyticsResult = await processRecyclingAnalytics(binResult.zone, binResult.composition, workflowId);
      state.analyticsFindings = analyticsResult;
      state.timestamps.analyticsCompletedAt = new Date().toISOString();

      // Step 4: Agent 4 - Civic Campaign & Engagement (Gemini Tool)
      state.currentAgent = 'Civic Campaign & Engagement Agent';
      const campaignResult = await processCampaignGeneration(analyticsResult, workflowId);
      state.campaign = campaignResult;
      state.timestamps.campaignProposedAt = new Date().toISOString();

      // Link events and tool calls for this workflowId
      state.agentMessages = store.agentMessages.filter(m => m.workflowId === workflowId);
      state.toolCalls = store.toolCalls.filter(t => t.workflowId === workflowId);

      store.saveToDisk();
      return state;
    } catch (err: any) {
      console.error(`[Orchestrator] Error in workflow ${workflowId}:`, err);
      state.workflowStatus = 'FAILED';
      state.errors.push(err.message || 'Unknown orchestration error');
      store.saveToDisk();
      return state;
    }
  }

  // Handle Human Approval Actions
  public static async handleHumanApproval(
    workflowId: string,
    entityType: 'ROUTE' | 'CAMPAIGN',
    entityId: string,
    action: 'APPROVED' | 'REJECTED' | 'REOPTIMIZED',
    comments?: string
  ) {
    const nowIso = new Date().toISOString();
    const state = store.workflowRuns.find(w => w.workflowId === workflowId) || store.workflowRuns[0];

    store.humanApprovals.unshift({
      id: `APPR-${Date.now().toString().slice(-5)}`,
      workflowId: state ? state.workflowId : workflowId,
      entityType,
      entityId,
      action,
      comments,
      actionBy: 'Municipal Dispatcher (Human-in-the-Loop)',
      timestamp: nowIso
    });

    if (entityType === 'ROUTE') {
      const route = store.routes.find(r => r.id === entityId || r.routeId === entityId);
      if (route) {
        if (action === 'APPROVED') {
          route.approvalStatus = 'APPROVED';
          route.updatedAt = nowIso;

          store.agentEvents.unshift({
            id: `EVT-${Date.now().toString().slice(-6)}`,
            workflowId: state ? state.workflowId : workflowId,
            agentName: ORCHESTRATOR_NAME,
            eventType: 'ROUTE_APPROVED',
            inputSummary: `Human Dispatcher approved Route ${route.routeId}`,
            outputSummary: `Route dispatch confirmed for ${route.truckName}`,
            toolUsed: 'humanApprovalGate',
            reasoning: `Human Dispatcher reviewed and approved route ${route.routeId}. Dispatch instructions sent to truck driver.`,
            latencyMs: 12,
            timestamp: nowIso,
            status: 'SUCCESS'
          });
        } else if (action === 'REJECTED' || action === 'REOPTIMIZED') {
          route.approvalStatus = 'REJECTED';
          // Trigger re-optimization
          await handleRoadClosureDisruption('Human Dispatcher Rejection / Traffic Override', route.orderedBins[0]?.neighborhood || 'Gandhipuram', workflowId);
        }
      }
    } else if (entityType === 'CAMPAIGN') {
      const cmp = store.campaigns.find(c => c.id === entityId);
      if (cmp) {
        if (action === 'APPROVED') {
          cmp.status = 'PUBLISHED';

          store.agentEvents.unshift({
            id: `EVT-${Date.now().toString().slice(-6)}`,
            workflowId: state ? state.workflowId : workflowId,
            agentName: ORCHESTRATOR_NAME,
            eventType: 'CAMPAIGN_PUBLISHED',
            inputSummary: `Human Administrator approved Campaign ${cmp.id}`,
            outputSummary: `Bilingual Campaign "${cmp.titleEn}" published live to citizen portal & social channels`,
            toolUsed: 'humanApprovalGate',
            reasoning: `Human Admin approved campaign ${cmp.id}. Campaign published to public portal and broadcasted in Tamil + English.`,
            latencyMs: 15,
            timestamp: nowIso,
            status: 'SUCCESS'
          });

          if (state) state.workflowStatus = 'COMPLETED';
        }
      }
    }

    store.saveToDisk();
    return { success: true, timestamp: nowIso };
  }

  // 22-Step Automated Demo Mode Execution
  public static async runFullAutomatedDemo(): Promise<SharedWorkflowState> {
    console.log('[Orchestrator] Starting 22-Step Automated Multi-Agent Demo...');
    
    // Step 1: Create fresh workflow
    const wf = this.createWorkflow('22-Step Automated Multi-Agent Demo');
    const wId = wf.workflowId;

    // Step 2-5: Bin Density Agent executes on BIN-005 critical overflow
    const binInput: WasteObservationInput = {
      binId: 'BIN-005',
      zone: 'Gandhipuram',
      fillPercentage: 98,
      capacityKg: 1000,
      estimatedWeightKg: 910,
      wasteObservation: {
        plasticBottles: 48,
        plasticCovers: 55,
        glassBottles: 10,
        metalCans: 14,
        aluminumContainers: 8,
        paper: 12,
        cardboard: 15,
        organicWaste: 22,
        eWaste: 1,
        other: 6
      },
      imageDescription: 'Severe commercial overflow at Gandhipuram sector 5 bin spillage onto sidewalk.'
    };

    const binResult = await processBinDensityAnalysis(binInput, wId);
    wf.binAnalysis = binResult;
    wf.wasteComposition = binResult.composition;

    // Step 6-9: Routing Agent proposes VRP route
    const routingResult = await processRoutingOptimization([binResult.binId], wId);
    wf.routes = [...store.routes.filter(r => r.routeId === routingResult.routeId)];

    // Step 10: Human Dispatcher approves route
    await this.handleHumanApproval(wId, 'ROUTE', routingResult.routeId, 'APPROVED', 'Automated Demo Human Approval');

    // Step 11-14: Road Closure occurs on DB Road -> Logistics Agent re-plans route
    store.roadClosures.unshift({
      id: `RC-DEMO-${Date.now()}`,
      roadName: 'DB Road West Axis',
      neighborhood: 'Gandhipuram',
      startLat: 11.0185,
      startLng: 76.9572,
      endLat: 11.0200,
      endLng: 76.9590,
      description: 'Pipeline Maintenance & Paving Work',
      active: true
    });

    await handleRoadClosureDisruption('DB Road West Axis Pipeline Blockage', 'Gandhipuram', wId);

    // Step 15-17: Analytics Agent identifies plastic anomaly in Ukkadam
    const analyticsResult = await processRecyclingAnalytics('Ukkadam', binResult.composition, wId);
    wf.analyticsFindings = analyticsResult;

    // Step 18-20: Campaign Agent uses Gemini tool to generate Tamil + English campaign
    const campaignResult = await processCampaignGeneration(analyticsResult, wId);
    wf.campaign = campaignResult;

    // Step 21-22: Human approves campaign -> Published
    const createdCmp = store.campaigns[0];
    if (createdCmp) {
      await this.handleHumanApproval(wId, 'CAMPAIGN', createdCmp.id, 'APPROVED', 'Automated Demo Campaign Approval');
    }

    wf.workflowStatus = 'COMPLETED';
    wf.timestamps.completedAt = new Date().toISOString();

    // Link all generated events, messages, tool calls
    wf.agentMessages = store.agentMessages.filter(m => m.workflowId === wId || !m.workflowId);
    wf.toolCalls = store.toolCalls.filter(t => t.workflowId === wId || !t.workflowId);

    store.saveToDisk();
    console.log(`[Orchestrator] Completed 22-Step Automated Demo for Workflow ${wId}`);

    return wf;
  }
}
