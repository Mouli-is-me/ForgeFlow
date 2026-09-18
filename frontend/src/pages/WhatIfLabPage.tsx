import React, { useState } from "react";
import { ArrowRight, TrendingUp, Cpu, AlertTriangle, Settings2, Sparkles } from "lucide-react";
import { useSimulationStore } from "../store/useSimulationStore";
import { SimulationEngine } from "../engine/SimulationEngine";
import { SimulationConfig, SimulationState } from "../engine/types";
import { BottleneckAnalyzer } from "../engine/BottleneckAnalyzer";
import { OllamaProvider, FallbackMockProvider, AIProvider } from "../ai/provider";
import { generateParserPrompt, generateExplainerPrompt } from "../ai/prompts";
import { validateScenario, applyScenarioToConfig } from "../ai/validation";
import { AIParsedScenario, AIScenarioChange } from "../ai/scenario/types";

const RUN_SECONDS = 3600 * 8; // 8 hours

export const WhatIfLabPage: React.FC = () => {
  const { config } = useSimulationStore();
  
  // Manual Controls State
  const [selectedMachine, setSelectedMachine] = useState(config.stages[0]?.id || "");
  const [selectedParam, setSelectedParam] = useState<AIScenarioChange['parameter']>('processingTimeSec');
  const [selectedOp, setSelectedOp] = useState<AIScenarioChange['operation']>('multiply');
  const [val, setVal] = useState<number>(1.2);

  // AI State
  const [query, setQuery] = useState("");
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [isAiExplaining, setIsAiExplaining] = useState(false);
  const [parsedScenario, setParsedScenario] = useState<AIParsedScenario | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Engine State
  const [isRunning, setIsRunning] = useState(false);
  const [baselineResult, setBaselineResult] = useState<SimulationState | null>(null);
  const [scenarioResult, setScenarioResult] = useState<SimulationState | null>(null);

  const getProvider = (): AIProvider => {
    return import.meta.env.VITE_AI_ENABLED === 'false' ? new FallbackMockProvider() : new OllamaProvider();
  };

  const runEngine = (simulationConfig: SimulationConfig) => {
    const engine = new SimulationEngine(simulationConfig);
    for (let second = 0; second < RUN_SECONDS; second += 1) engine.tick();
    const result = engine.getState();
    result.bottleneck = BottleneckAnalyzer.analyze(result);
    return result;
  };

  const handleAIParse = async () => {
    if (!query.trim()) return;
    setIsAiParsing(true);
    setError(null);
    setParsedScenario(null);

    try {
      const provider = getProvider();
      const prompt = generateParserPrompt(query, config);
      const aiResponse = await provider.chat([{ role: 'user', content: prompt }]);
      
      let parsedJson;
      try {
        parsedJson = JSON.parse(aiResponse);
      } catch (e) {
        throw new Error("Failed to parse AI response as JSON.");
      }

      const validated = validateScenario(parsedJson, config);
      if (!validated.valid || !validated.changes || validated.changes.length === 0) {
        throw new Error(validated.error || "Scenario invalid or empty.");
      }

      setParsedScenario(validated);
      
      // Populate manual controls with first change
      const change = validated.changes[0];
      setSelectedMachine(change.machineId);
      setSelectedParam(change.parameter);
      setSelectedOp(change.operation);
      setVal(change.value);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during AI parsing.");
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleRunSimulation = () => {
    setIsRunning(true);
    setBaselineResult(null);
    setScenarioResult(null);
    setExplanation(null);

    // Give UI time to update
    setTimeout(() => {
      try {
        const changes: AIScenarioChange[] = [{
          machineId: selectedMachine,
          parameter: selectedParam,
          operation: selectedOp,
          value: val
        }];

        const baselineConfig = JSON.parse(JSON.stringify(config)) as SimulationConfig;
        const bResult = runEngine(baselineConfig);
        
        const scenarioConfig = applyScenarioToConfig(baselineConfig, changes);
        const sResult = runEngine(scenarioConfig);

        setBaselineResult(bResult);
        setScenarioResult(sResult);
      } catch (err: any) {
         setError("Simulation failed: " + err.message);
      } finally {
        setIsRunning(false);
      }
    }, 50);
  };

  const handleAIExplain = async () => {
    if (!baselineResult || !scenarioResult) return;
    setIsAiExplaining(true);
    try {
      const provider = getProvider();
      const baselineStr = `Throughput: ${baselineResult.throughputPerHour.toFixed(1)}, Total: ${baselineResult.totalCompleted}, Bottleneck: ${baselineResult.bottleneck?.machineId || 'None'}`;
      const scenarioStr = `Throughput: ${scenarioResult.throughputPerHour.toFixed(1)}, Total: ${scenarioResult.totalCompleted}, Bottleneck: ${scenarioResult.bottleneck?.machineId || 'None'}`;
      
      const expPrompt = generateExplainerPrompt(query || "Manual scenario run", baselineStr, scenarioStr);
      const expResponse = await provider.chat([{ role: 'user', content: expPrompt }]);
      setExplanation(expResponse);
    } catch (err: any) {
      setError(err.message || "Failed to generate AI explanation.");
    } finally {
      setIsAiExplaining(false);
    }
  };

  const changeStr = (baseline: number, scenario: number) =>
    `${scenario - baseline >= 0 ? "+" : ""}${(scenario - baseline).toFixed(1)}`;

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <p className="text-xs uppercase tracking-[0.22em] text-primary font-semibold mb-2 flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> What-If Lab
          </p>
          <h1 className="text-3xl font-semibold text-foreground">Scenario Comparison</h1>
          <p className="text-muted mt-2">Modify production parameters and run isolated, deterministic simulations to evaluate throughput and bottleneck shifts.</p>
        </header>

        {error && (
          <div className="bg-danger/10 border border-danger/30 p-4 rounded flex items-center gap-3 text-danger">
             <AlertTriangle className="w-5 h-5" />
             <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* OPTIONAL AI SHORTCUT */}
        <section className="bg-surface/50 border border-border border-dashed rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-info" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Optional AI Shortcut</h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <input 
              type="text" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g., What if Machine 2 becomes 20% slower?"
              className="flex-1 bg-background border border-border rounded px-4 py-2 text-sm text-foreground focus:outline-none focus:border-info w-full"
              onKeyDown={e => e.key === 'Enter' && handleAIParse()}
            />
            <button
              type="button"
              onClick={handleAIParse}
              disabled={isAiParsing || !query.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-info hover:bg-info/90 text-white text-sm rounded font-medium disabled:opacity-50 w-full md:w-auto transition-colors"
            >
              {isAiParsing ? "Parsing..." : "Convert to Scenario"}
            </button>
          </div>
          {parsedScenario && parsedScenario.valid && (
            <div className="mt-4 p-3 bg-info/10 border border-info/20 rounded text-sm text-foreground">
              <span className="font-semibold text-info mr-2">AI Interpreted:</span>
              {parsedScenario.explanation} (Form populated below)
            </div>
          )}
        </section>

        {/* MANUAL CONFIGURATION */}
        <section className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Settings2 className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Scenario Configuration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Machine</label>
              <select 
                value={selectedMachine} 
                onChange={e => setSelectedMachine(e.target.value)}
                className="bg-background border border-border rounded px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                {config.stages.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Parameter</label>
              <select 
                value={selectedParam} 
                onChange={e => setSelectedParam(e.target.value as any)}
                className="bg-background border border-border rounded px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="processingTimeSec">Processing Time (sec)</option>
                <option value="capacity">Capacity</option>
                <option value="machineCount">Machine Count</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Adjustment</label>
              <div className="flex gap-2">
                <select 
                  value={selectedOp} 
                  onChange={e => setSelectedOp(e.target.value as any)}
                  className="bg-background border border-border rounded px-3 py-2 text-sm text-foreground outline-none focus:border-primary w-1/2"
                >
                  <option value="multiply">Multiply by</option>
                  <option value="set">Set to</option>
                  <option value="add">Add</option>
                </select>
                <input 
                  type="number"
                  step="0.1"
                  value={val}
                  onChange={e => setVal(parseFloat(e.target.value))}
                  className="bg-background border border-border rounded px-3 py-2 text-sm text-foreground outline-none focus:border-primary w-1/2"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isRunning}
              className="flex items-center justify-center gap-2 px-6 py-2 h-[38px] bg-primary hover:bg-primary/90 text-primary-foreground rounded font-semibold disabled:opacity-50 transition-colors"
            >
              {isRunning ? "Simulating..." : "Run Simulation"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* RESULTS */}
        {baselineResult && scenarioResult && (
          <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-success" />
              <h2 className="text-xl font-semibold text-foreground">Simulation Result ({RUN_SECONDS / 3600}h run)</h2>
            </div>
            
            <div className="overflow-x-auto bg-surface border border-border rounded-lg shadow-sm">
              <table className="w-full text-left">
                <thead className="text-xs uppercase tracking-wider text-muted border-b border-border bg-background/50">
                  <tr>
                    <th className="px-5 py-4">Measured metric</th>
                    <th className="px-5 py-4">Baseline</th>
                    <th className="px-5 py-4">Scenario</th>
                    <th className="px-5 py-4">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  <CompareRow
                    label="Throughput"
                    baseline={`${baselineResult.throughputPerHour.toFixed(1)} /hr`}
                    scenario={`${scenarioResult.throughputPerHour.toFixed(1)} /hr`}
                    change={changeStr(baselineResult.throughputPerHour, scenarioResult.throughputPerHour)}
                  />
                  <CompareRow
                    label="Units completed"
                    baseline={`${baselineResult.totalCompleted}`}
                    scenario={`${scenarioResult.totalCompleted}`}
                    change={changeStr(baselineResult.totalCompleted, scenarioResult.totalCompleted)}
                  />
                  <CompareRow
                    label="Primary constraint"
                    baseline={baselineResult.bottleneck?.machineId || "None"}
                    scenario={scenarioResult.bottleneck?.machineId || "None"}
                    change={baselineResult.bottleneck?.machineId === scenarioResult.bottleneck?.machineId ? "Unchanged" : "Shifted"}
                  />
                </tbody>
              </table>
            </div>

            {/* OPTIONAL AI EXPLANATION */}
            <div className="flex flex-col items-start gap-4">
              {!explanation && (
                <button
                  onClick={handleAIExplain}
                  disabled={isAiExplaining}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-info border border-info/30 hover:bg-info/10 rounded transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  {isAiExplaining ? "Generating..." : "Explain with AI"}
                </button>
              )}

              {explanation && (
                <div className="bg-surface border-l-4 border-info p-5 rounded shadow-sm w-full">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-info mb-2 flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> AI Analysis
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed">
                    {explanation}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const CompareRow: React.FC<{ label: string; baseline: string; scenario: string; change: string; }> = ({ label, baseline, scenario, change }) => (
  <tr>
    <td className="px-5 py-4 font-medium text-foreground">{label}</td>
    <td className="px-5 py-4 font-mono text-muted">{baseline}</td>
    <td className="px-5 py-4 font-mono text-foreground">{scenario}</td>
    <td className="px-5 py-4 font-mono text-primary font-bold">{change}</td>
  </tr>
);
