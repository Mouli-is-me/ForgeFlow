import { SimulationConfig } from '../../engine/types';

export const generateParserPrompt = (query: string, config: SimulationConfig) => {
  const machines = config.stages.map(s => `${s.id} (${s.name})`).join(', ');
  
  return `You are an AI assistant for a manufacturing digital twin.
The user will ask for a "what-if" scenario. 
Your job is to parse their request into a STRICT JSON schema.
Do NOT output anything other than JSON.

Allowed Machine IDs: ${machines}
Allowed Parameters: "processingTimeSec", "capacity", "machineCount"
Allowed Operations: "multiply", "set", "add"

JSON Schema:
{
  "valid": boolean,
  "changes": [
    {
      "machineId": "string",
      "parameter": "string",
      "operation": "string",
      "value": number
    }
  ],
  "explanation": "string (brief summary of what this scenario represents)"
}

Example 1: "What if Machine 2 is 20% slower?"
{
  "valid": true,
  "changes": [{"machineId": "s2", "parameter": "processingTimeSec", "operation": "multiply", "value": 1.2}],
  "explanation": "Decreased Machine 2 processing speed by 20%."
}

Example 2: "What if we add another assembly machine?" (Assume assembly is s3)
{
  "valid": true,
  "changes": [{"machineId": "s3", "parameter": "machineCount", "operation": "add", "value": 1}],
  "explanation": "Added 1 additional machine to Assembly."
}

User Query: "${query}"
Output JSON only.`;
};

export const generateExplainerPrompt = (query: string, baselineStr: string, scenarioStr: string) => {
  return `You are an industrial engineering AI assistant.
A what-if simulation has just completed. Explain the results to the user clearly.
DO NOT INVENT NUMBERS. Only use the numbers provided in the data.

User Query: "${query}"
Baseline Metrics: ${baselineStr}
Scenario Metrics: ${scenarioStr}

Explain what changed and why, specifically noting if the bottleneck shifted. Keep it professional, concise, and focused on the manufacturing implications.
Do NOT output JSON. Output normal text.`;
};
