import axios from 'axios';
import { LineConfig, SimulationResult } from '../types/api';

const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  checkHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  getLineStatus: async (): Promise<LineConfig> => {
    const response = await apiClient.get('/line/status');
    return response.data;
  },

  runSimulation: async (durationMinutes: number = 1440, events: any[] = []): Promise<SimulationResult> => {
    const response = await apiClient.post('/simulation/run', {
      duration_minutes: durationMinutes,
      events: events,
    });
    return response.data;
  },
};
