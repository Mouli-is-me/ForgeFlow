import { AIParsedScenario, AIScenarioChange } from '../scenario/types';
import { SimulationConfig } from '../../engine/types';

export function validateScenario(parsed: any, currentConfig: SimulationConfig): AIParsedScenario {
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'Invalid response format from AI.' };
  }

  if (parsed.valid === false) {
    return { valid: false, error: parsed.error || 'AI could not interpret the request.' };
  }

  if (!Array.isArray(parsed.changes)) {
    return { valid: false, error: 'Changes must be an array.' };
  }

  const validParameters = ['processingTimeSec', 'capacity', 'machineCount'];
  const validOperations = ['multiply', 'set', 'add'];
  
  const validatedChanges: AIScenarioChange[] = [];

  for (const change of parsed.changes) {
    if (!change.machineId || !currentConfig.stages.find(s => s.id === change.machineId)) {
      return { valid: false, error: `Invalid or unknown machine: ${change.machineId}` };
    }
    if (!validParameters.includes(change.parameter)) {
      return { valid: false, error: `Unsupported parameter: ${change.parameter}` };
    }
    if (!validOperations.includes(change.operation)) {
      return { valid: false, error: `Unsupported operation: ${change.operation}` };
    }
    if (typeof change.value !== 'number' || isNaN(change.value)) {
      return { valid: false, error: `Invalid numeric value for ${change.parameter}` };
    }
    
    // Bounds checking
    if (change.parameter === 'capacity' && change.value < 0) {
        return { valid: false, error: 'Capacity cannot be negative.' };
    }
    if (change.parameter === 'processingTimeSec' && change.value < 0) {
        return { valid: false, error: 'Processing time cannot be negative.' };
    }
    
    validatedChanges.push({
      machineId: change.machineId,
      parameter: change.parameter as any,
      operation: change.operation as any,
      value: change.value
    });
  }

  return {
    valid: true,
    changes: validatedChanges,
    explanation: parsed.explanation || 'Scenario validated successfully.'
  };
}

export function applyScenarioToConfig(config: SimulationConfig, changes: AIScenarioChange[]): SimulationConfig {
  const newConfig = JSON.parse(JSON.stringify(config)) as SimulationConfig;
  
  for (const change of changes) {
    const stage = newConfig.stages.find(s => s.id === change.machineId);
    if (!stage) continue;
    
    let currentValue = stage[change.parameter];
    if (change.operation === 'multiply') {
      currentValue = currentValue * change.value;
    } else if (change.operation === 'set') {
      currentValue = change.value;
    } else if (change.operation === 'add') {
      currentValue = currentValue + change.value;
    }
    
    // Safety bounds
    if (currentValue < 0) currentValue = 0;
    if (change.parameter === 'machineCount' && currentValue < 1) currentValue = 1;
    
    stage[change.parameter] = currentValue as never;
  }
  
  return newConfig;
}
