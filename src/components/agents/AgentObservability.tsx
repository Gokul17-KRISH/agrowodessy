import React, { useState, useEffect } from 'react';
import {
  Bot,
  Zap,
  Clock,
  Terminal,
  Wrench,
  Play,
  CheckCircle2,
  Share2,
  Cpu,
  Layers,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { AgentStatus, AgentEvent, SharedWorkflowState, AgentMessage, ToolCallLog } from '../../types.js';
import { api } from '../../services/api.js';

interface AgentObservabilityProps {
  agentStatuses: AgentStatus[];
  agentEvents: AgentEvent[];
  onTriggerOrchestration: () => void;
}

export const AgentObservability: React.FC<AgentObservabilityProps> = ({
  agentStatuses,
  agentEvents,
  onTriggerOrchestration
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'agents' | 'workflows' | 'messages' | 'tools'>('agents');
  const [workflows, setWorkflows] = useState<SharedWorkflowState[]>([]);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCallLog[]>([]);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoState, setDemoState] = useState<SharedWorkflowState | null>(null);

  const fetchExtendedLogs = async () => {
    try {
      const [wfRes, msgRes, toolRes] = await Promise.all([
        api.getWorkflows(),
        api.getAgentMessages(),
        api.getToolCalls()
      ]);
      if (wfRes.success) setWorkflows(wfRes.data || []);
      if (msgRes.success) setAgentMessages(msgRes.data || []);
      if (toolRes.success) setToolCalls(toolRes.data || []);
    } catch (e) {
      console.warn('Failed loading extended agent logs:', e);
    }
  };

  useEffect(() => {
    fetchExtendedLogs();
    const interval = setInterval(fetchExtendedLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRunFullDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await api.triggerWorkflowDemo();
      if (res.success && res.data) {
        setDemoState(res.data);
        setActiveSubTab('workflows');
      }
    } catch (e) {
      console.error('Demo error:', e);
    } finally {
      setLoadingDemo(false);
      fetchExtendedLogs();
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Bot className="w-5 h-5" />
            </span>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              4-AGENT AGENTIC AI ARCHITECTURE & OBSERVABILITY ENGINE
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Stateful 4-Agent Orchestrator • Real Backend Tool Executions • Inter-Agent Event Messaging • Human-in-the-Loop Approval Gates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunFullDemo}
            disabled={loadingDemo}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            {loadingDemo ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            START 22-STEP AUTOMATED DEMO
          </button>

          <button
            onClick={onTriggerOrchestration}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 border border-slate-200"
          >
            <Zap className="w-4 h-4 text-emerald-600" />
            TRIGGER STEP
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab('agents')}
          className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'agents'
              ? 'bg-white border-t border-x border-slate-200 text-emerald-700 border-b-2 border-b-emerald-600 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          4 Specialist Agents ({agentStatuses.length})
        </button>

        <button
          onClick={() => setActiveSubTab('workflows')}
          className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'workflows'
              ? 'bg-white border-t border-x border-slate-200 text-emerald-700 border-b-2 border-b-emerald-600 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Shared Workflow State ({workflows.length})
        </button>

        <button
          onClick={() => setActiveSubTab('messages')}
          className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'messages'
              ? 'bg-white border-t border-x border-slate-200 text-emerald-700 border-b-2 border-b-emerald-600 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Inter-Agent Events ({agentMessages.length})
        </button>

        <button
          onClick={() => setActiveSubTab('tools')}
          className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'tools'
              ? 'bg-white border-t border-x border-slate-200 text-emerald-700 border-b-2 border-b-emerald-600 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Tool Executions ({toolCalls.length})
        </button>
      </div>

      {/* SUB-TAB 1: 4 Specialist Agents */}
      {activeSubTab === 'agents' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(agentStatuses || []).map((agent) => (
              <div
                key={agent.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs space-y-3 hover:border-emerald-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900 tracking-tight">{agent.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">{agent.role}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Latest Operational Action:</span>
                  "{agent.lastAction}"
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-2.5 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-600" /> Latency: {agent.latencyMs}ms
                  </span>
                  <span>Executed: {agent.eventsCount} events</span>
                </div>
              </div>
            ))}
          </div>

          {/* Core Architectural Diagram Summary */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Stateful Multi-Agent Orchestration Flow
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              1. <strong>Bin Density & Waste Composition Agent</strong> processes raw sensor data + waste observations, computes density classification, fill rate (%/h), overflow risk, and assigns priority code (P1-P5).
              <br />
              2. <strong>Logistics & Dynamic Routing Agent</strong> receives critical bin events, invokes VRP Solver considering truck capacities, driver schedules, traffic jams, and road closures. Requires human dispatcher approval.
              <br />
              3. <strong>Recycling Intelligence & Analytics Agent</strong> evaluates 30-day cross-zone diversion baselines, detects plastic contamination anomalies (e.g. Ukkadam 51% plastic spike).
              <br />
              4. <strong>Civic Campaign & Engagement Agent</strong> triggers Gemini AI tool to generate bilingual Tamil + English behavioral campaigns. Awaiting human admin approval before publishing.
            </p>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Shared Workflow State Inspector */}
      {activeSubTab === 'workflows' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200">
              <Layers className="w-4 h-4 text-emerald-600" />
              SHARED WORKFLOW STATE RUNS
            </h3>

            {workflows.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No workflow runs recorded yet. Click "START 22-STEP AUTOMATED DEMO" above to launch a complete pipeline.
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {(workflows || []).map((wf) => (
                  <div key={wf.workflowId} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-xs text-emerald-800">{wf.workflowId}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {wf.workflowStatus}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">Trigger: {wf.trigger}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(wf.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Step Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {/* Step 1 */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Agent 1: Bin Analysis</span>
                        {wf.binAnalysis ? (
                          <div>
                            <span className="font-bold text-slate-900">{wf.binAnalysis.binId} ({wf.binAnalysis.zone})</span>
                            <p className="text-[11px] text-slate-600">{wf.binAnalysis.fillLevel}% fill • Priority: {wf.binAnalysis.priority}</p>
                            <p className="text-[10px] text-amber-700 font-semibold">{wf.binAnalysis.composition?.dominantCategory} ({wf.binAnalysis.composition?.categoryPercentages?.plastic}% plastic)</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </div>

                      {/* Step 2 */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Agent 2: Proposed Route</span>
                        {wf.routes && wf.routes.length > 0 ? (
                          <div>
                            <span className="font-bold text-slate-900">{wf.routes[0].routeId}</span>
                            <p className="text-[11px] text-slate-600">{wf.routes[0].totalDistanceKm}km • {wf.routes[0].estimatedTimeMin} mins</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              wf.routes[0].approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {wf.routes[0].approvalStatus}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </div>

                      {/* Step 3 */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Agent 3: Recycling Insight</span>
                        {wf.analyticsFindings ? (
                          <div>
                            <span className="font-bold text-rose-800">{wf.analyticsFindings.severity} Anomaly</span>
                            <p className="text-[11px] text-slate-700">{wf.analyticsFindings.evidence?.currentPlasticPercentage}% plastic spike in {wf.analyticsFindings.zone}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </div>

                      {/* Step 4 */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Agent 4: Gemini Campaign</span>
                        {wf.campaign ? (
                          <div>
                            <span className="font-bold text-slate-900">{wf.campaign.titleEn}</span>
                            <p className="text-[10px] text-emerald-800 font-semibold">{wf.campaign.titleTa}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              wf.campaign.approvalStatus === 'PUBLISHED' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {wf.campaign.approvalStatus}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Inter-Agent Message Stream */}
      {activeSubTab === 'messages' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              INTER-AGENT EVENT & MESSAGE STREAM
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Structured Event Payloads</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {agentMessages.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No inter-agent messages logged yet.</div>
            ) : (
              (agentMessages || []).map((msg) => (
                <div key={msg.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-emerald-800">{msg.sourceAgent}</span>
                      <span className="text-slate-400">➔</span>
                      <span className="font-bold text-slate-700">{msg.targetAgent}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                        {msg.eventType}
                      </span>
                    </div>
                    <span className="text-slate-400 text-[10px] font-semibold">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-sans text-slate-800 text-[11px] overflow-x-auto">
                    <pre className="text-[10px] font-mono">{JSON.stringify(msg.payload, null, 2)}</pre>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Tool Execution Engine */}
      {activeSubTab === 'tools' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-teal-600" />
              EXPLICIT AGENT TOOL EXECUTION LOGS
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Recorded Tool Invocations</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {toolCalls.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No tool calls recorded yet.</div>
            ) : (
              (toolCalls || []).map((tc) => (
                <div key={tc.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-slate-900">{tc.agentName}</span>
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-extrabold text-[10px] flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> Tool: {tc.toolName}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[10px] font-semibold">
                      {new Date(tc.timestamp).toLocaleTimeString()} • {tc.latencyMs}ms
                    </span>
                  </div>

                  <div className="text-slate-800 font-sans text-[11px] font-semibold bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-teal-700 font-bold">Result Summary: </span>
                    {tc.resultSummary}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
