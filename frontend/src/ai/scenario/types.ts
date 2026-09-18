export interface AIScenarioChange {
  machineId: string;
  parameter: 'processingTimeSec' | 'capacity' | 'machineCount';
  operation: 'multiply' | 'set' | 'add';
  value: number;
}

export interface AIParsedScenario {
  valid: boolean;
  changes?: AIScenarioChange[];
  explanation?: string;
  error?: string;
}
