import React, { useState } from "react";
import { ArrowRight, FlaskConical, TrendingUp, Cpu, AlertTriangle } from "lucide-react";
import { useSimulationStore } from "../store/useSimulationStore";
import { SimulationEngine } from "../engine/SimulationEngine";
import { SimulationConfig, SimulationState } from "../engine/types";
import { BottleneckAnalyzer } from "../engine/BottleneckAnalyzer";
import { OllamaProvider, FallbackMockProvider, AIProvider } from "../ai/provider";
import { generateParserPrompt, generateExplainerPrompt } from "../ai/prompts";
import { validateScenario, applyScenarioToConfig } from "../ai/validation";
import { AIParsedScenario } from "../ai/scenario/types";

const RUN_SECONDS = 3600 * 8; // 8 hours

export const WhatIfLabPage: React.FC = () => {
  const { config } = useSimulationStore();
  const [query, setQuery] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  
  const [parsedScenario, setParsedScenario] = useState<AIParsedScenario | null>(null);
  const [baselineResult, setBaselineResult] = useState<SimulationState | null>(null);
  const [scenarioResult, setScenarioResult] = useState<SimulationState | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleAsk = async () => {
    if (!query.trim()) return;
    setIsRunning(true);
    setError(null);
    setParsedScenario(null);
    setBaselineResult(null);
    setScenarioResult(null);
    setExplanation(null);

    const provider = getProvider();

    try {
      // 1. Ask AI to parse
      const prompt = generateParserPrompt(query, config);
      const aiResponse = await provider.chat([{ role: 'user', content: prompt }]);
      
      let parsedJson;
      try {
        parsedJson = JSON.parse(aiResponse);
      } catch (e) {
        throw new Error("Failed to parse AI response as JSON.");
      }

      // 2. Validate
      const validated = validateScenario(parsedJson, config);
      setParsedScenario(validated);

      if (!validated.valid || !validated.changes) {
        throw new Error(validated.error || "Scenario invalid.");
      }

      // 3. Run Baseline
      const baselineConfig = JSON.parse(JSON.stringify(config)) as SimulationConfig;
      const bResult = runEngine(baselineConfig);
      
      // 4. Run Scenario
      const scenarioConfig = applyScenarioToConfig(baselineConfig, validated.changes);
      const sResult = runEngine(scenarioConfig);

      setBaselineResult(bResult);
      setScenarioResult(sResult);

      // 5. Ask AI to Explain
      const baselineStr = `Throughput: ${bResult.throughputPerHour.toFixed(1)}, Total: ${bResult.totalCompleted}, Bottleneck: ${bResult.bottleneck?.machineId || 'None'}`;
      const scenarioStr = `Throughput: ${sResult.throughputPerHour.toFixed(1)}, Total: ${sResult.totalCompleted}, Bottleneck: ${sResult.bottleneck?.machineId || 'None'}`;
      
      const expPrompt = generateExplainerPrompt(query, baselineStr, scenarioStr);
      const expResponse = await provider.chat([{ role: 'user', content: expPrompt }]);
      setExplanation(expResponse);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during AI processing.");
    } finally {
      setIsRunning(false);
    }
  };

  const changeStr = (baseline: number, scenario: number) =>
    `${scenario - baseline >= 0 ? "+" : ""}${(scenario - baseline).toFixed(1)}`;

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <p className="text-xs uppercase tracking-[0.22em] text-primary font-semibold mb-2 flex items-center gap-2">
            <Cpu className="w-4 h-4" /> AI-Assisted Experimentation
          </p>
          <h1 className="text-3xl font-semibold text-foreground">What happens if...?</h1>
          <p className="text-muted mt-2">Use natural language to explore operational changes safely in a parallel simulation environment.</p>
        </header>

        <section className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <FlaskConical className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Ask the simulation</h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input 
              type="text" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g., What if Machine 2 becomes 20% slower?"
              className="flex-1 bg-background border border-border rounded px-4 py-3 text-foreground focus:outline-none focus:border-primary w-full"
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
            />
            <button
              type="button"
              onClick={handleAsk}
              disabled={isRunning || !query.trim()}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-primary hover:opacity-90 text-primary-foreground rounded font-semibold disabled:opacity-50 w-full md:w-auto transition-opacity"
            >
              {isRunning ? "Simulating..." : "Run Scenario"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4 flex gap-2 text-xs text-muted">
            <span className="font-semibold">Suggested:</span>
            <button onClick={() => setQuery("Make Inspection 20% slower")} className="hover:text-primary hover:underline">Make Inspection 20% slower</button> |
            <button onClick={() => setQuery("Add another machine to Assembly")} className="hover:text-primary hover:underline">Add another machine to Assembly</button>
          </div>
        </section>

        {error && (
          <div className="bg-danger/10 border border-danger/30 p-4 rounded flex items-center gap-3 text-danger">
             <AlertTriangle className="w-5 h-5" />
             <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {parsedScenario && parsedScenario.valid && (
           <div className="bg-surface border border-border p-4 rounded flex flex-col gap-2 shadow-sm animate-in fade-in">
             <h3 className="text-xs uppercase tracking-wider font-semibold text-muted">AI Interpretation</h3>
             <p className="text-sm text-foreground">{parsedScenario.explanation}</p>
             <div className="flex flex-wrap gap-2 mt-2">
               {parsedScenario.changes?.map((c, i) => (
                 <span key={i} className="text-xs bg-background border border-border px-2 py-1 rounded text-foreground font-mono">
                   {c.machineId} : {c.parameter} {c.operation} {c.value}
                 </span>
               ))}
             </div>
           </div>
        )}

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

            {explanation && (
              <div className="bg-surface border-l-4 border-info p-5 rounded shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-info mb-2 flex items-center gap-2">
                  <Cpu className="w-4 h-4" /> AI Analysis
                </h3>
                <p className="text-sm text-foreground leading-relaxed">
                  {explanation}
                </p>
              </div>
            )}
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
