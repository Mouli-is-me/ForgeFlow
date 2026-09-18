import { expect, test, describe } from 'vitest';
import { validateScenario } from './index';
import { SimulationConfig } from '../../engine/types';
import { AIScenarioChange } from '../scenario/types';

describe('AI Scenario Validation & Consistency', () => {
  const dummyConfig: SimulationConfig = {
    randomSeed: 123,
    arrivalRatePerHour: 100,
    stages: [
      { id: 'm1', name: 'M1', processingTimeSec: 10, capacity: 5, failureProbability: 0, meanRecoveryTimeSec: 0, machineCount: 1, availability: 100, queueCapacity: 100 },
      { id: 'm2', name: 'Machine 2', processingTimeSec: 20, capacity: 5, failureProbability: 0, meanRecoveryTimeSec: 0, machineCount: 1, availability: 100, queueCapacity: 100 }
    ]
  };

  test('Valid scenario parses successfully', () => {
    const raw = {
      valid: true,
      changes: [
        { machineId: 'm2', parameter: 'processingTimeSec', operation: 'multiply', value: 1.2 }
      ],
      explanation: 'Made m2 slower'
    };

    const res = validateScenario(raw, dummyConfig);
    expect(res.valid).toBe(true);
    expect(res.changes?.length).toBe(1);
    expect(res.changes?.[0].machineId).toBe('m2');
  });

  test('Manual input and AI parsing produce identical structured scenario objects', () => {
    // 1. Manual Path (User uses dropdowns)
    const manualScenario: AIScenarioChange = {
      machineId: 'm2',
      parameter: 'processingTimeSec',
      operation: 'multiply',
      value: 1.2
    };

    // 2. AI Path (Mocking the AI returning JSON for "What if Machine 2 is 20% slower?")
    const aiRawOutput = {
      valid: true,
      changes: [
        { machineId: 'm2', parameter: 'processingTimeSec', operation: 'multiply', value: 1.2 }
      ],
      explanation: 'Increased processing time on Machine 2 by 20%.'
    };

    const validatedAiResult = validateScenario(aiRawOutput, dummyConfig);

    // Both paths must converge on the exact same structured object
    expect(validatedAiResult.valid).toBe(true);
    expect(validatedAiResult.changes![0]).toEqual(manualScenario);
  });

  test('Invalid machine ID is rejected', () => {
    const raw = {
      valid: true,
      changes: [
        { machineId: 'm3', parameter: 'processingTimeSec', operation: 'multiply', value: 1.2 }
      ]
    };

    const res = validateScenario(raw, dummyConfig);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('m3');
  });

  test('Negative capacity is rejected', () => {
    const raw = {
      valid: true,
      changes: [
        { machineId: 'm1', parameter: 'capacity', operation: 'set', value: -5 }
      ]
    };

    const res = validateScenario(raw, dummyConfig);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('negative');
  });
});
