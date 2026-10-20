import {
  DigitalTwinState,
  MotorConfig,
  TelemetryPoint,
  PredictionRecord,
  AlertRecord,
  SimulatorStatus,
  SystemStatus
} from '../types';

const API_BASE = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error ${res.status}: ${errorText || res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Motors
  getMotors: () => fetchJson<MotorConfig[]>(`${API_BASE}/motors`),
  getMotor: (id: string) => fetchJson<MotorConfig>(`${API_BASE}/motors/${id}`),

  // Digital Twin
  getAllTwins: () => fetchJson<DigitalTwinState[]>(`${API_BASE}/twin`),
  getTwin: (motorId: string) => fetchJson<DigitalTwinState>(`${API_BASE}/twin/${motorId}`),

  // Telemetry History
  getTelemetryHistory: (motorId: string, limit = 30) =>
    fetchJson<TelemetryPoint[]>(`${API_BASE}/telemetry/history/${motorId}?limit=${limit}`),

  // Predictions & Explanations
  getPredictionHistory: (motorId: string, limit = 30) =>
    fetchJson<PredictionRecord[]>(`${API_BASE}/predictions/history/${motorId}?limit=${limit}`),
  getGlobalImportance: () =>
    fetchJson<{ global_importance: { feature_name: string; mean_abs_shap: number }[] }>(
      `${API_BASE}/predictions/global-importance`
    ),

  // Alerts
  getAlerts: (motorId?: string, status?: string) => {
    let url = `${API_BASE}/alerts`;
    const params = new URLSearchParams();
    if (motorId) params.append('motorId', motorId);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;
    return fetchJson<AlertRecord[]>(url);
  },
  acknowledgeAlert: (id: number, operatorNote?: string) =>
    fetchJson<AlertRecord>(`${API_BASE}/alerts/${id}/acknowledge`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operatorNote })
    }),
  resolveAlert: (id: number, operatorNote?: string) =>
    fetchJson<AlertRecord>(`${API_BASE}/alerts/${id}/resolve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operatorNote })
    }),

  // Simulator
  getSimulatorStatus: () => fetchJson<SimulatorStatus>(`${API_BASE}/simulator/status`),
  startSimulator: (motorId: string, scenario: string, severity: number, loadPct: number) =>
    fetchJson<SimulatorStatus>(
      `${API_BASE}/simulator/start?motorId=${motorId}&scenario=${scenario}&severity=${severity}&loadPct=${loadPct}`,
      { method: 'POST' }
    ),
  stopSimulator: () => fetchJson<SimulatorStatus>(`${API_BASE}/simulator/stop`, { method: 'POST' }),

  // System Status
  getSystemStatus: () => fetchJson<SystemStatus>(`${API_BASE}/status`)
};
