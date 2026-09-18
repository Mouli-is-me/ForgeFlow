import { expect, test, describe } from 'vitest';
import { validateScenario } from './index';
import { SimulationConfig } from '../../engine/types';

describe('AI Scenario Validation', () => {
  const dummyConfig: SimulationConfig = {
    randomSeed: 123,
    arrivalRatePerHour: 100,
    stages: [
      { id: 'm1', name: 'M1', processingTimeSec: 10, capacity: 5, availability: 100, failureProbability: 0, meanRecoveryTimeSec: 0, machineCount: 1, queueCapacity: 100 },
      { id: 'm2', name: 'M2', processingTimeSec: 20, capacity: 5, availability: 100, failureProbability: 0, meanRecoveryTimeSec: 0, machineCount: 1, queueCapacity: 100 }
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

  test('Invalid parameter is rejected', () => {
    const raw = {
      valid: true,
      changes: [
        { machineId: 'm1', parameter: 'fakeParam', operation: 'multiply', value: 1.2 }
      ]
    };

    const res = validateScenario(raw, dummyConfig);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('fakeParam');
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
