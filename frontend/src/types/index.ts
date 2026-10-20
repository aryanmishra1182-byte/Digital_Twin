export type OperationalState = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
export type AlertSeverity = 'P1_CRITICAL' | 'P2_WARNING' | 'P3_INFO';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface MotorConfig {
  id: string;
  name: string;
  ratedPowerKw: number;
  supplyVoltageV: number;
  supplyFreqHz: number;
  poles: number;
  ratedSpeedRpm: number;
  nominalSlip: number;
  location: string;
  registeredAt: string;
}

export interface ShapAttribution {
  feature_name: string;
  feature_value: number;
  shap_value: number;
  abs_shap: number;
  direction: 'INCREASES_RISK' | 'DECREASES_RISK';
  percentage_contribution: number;
}

export interface MaintenanceRecommendation {
  faultClass: string;
  isAnomaly: boolean;
  confidence: number;
  severity: AlertSeverity;
  title: string;
  summary: string;
  suggestedActions: string[];
  governingStandard: string;
  safetyDisclaimer: string;
}

export interface DigitalTwinState {
  motorId: string;
  motorName: string;
  configuration: MotorConfig;
  lastUpdated: string;
  operationalState: OperationalState;
  healthScore: number;
  isAnomaly: boolean;
  anomalyScore: number;
  predictedFaultClass: string;
  confidence: number;
  estimatedRulHours: number | null;
  rulUnit: string;
  latestCurrentRms: number;
  latestVibRms: number;
  latestVibKurtosis: number;
  latestTemperatureC: number;
  latestLoadPct: number;
  latestEstimatedSpeedRpm: number;
  activeAlertCount: number;
  classProbabilities?: Record<string, number>;
  topShapAttributions?: ShapAttribution[];
  latestMaintenanceRecommendation?: MaintenanceRecommendation;
}

export interface TelemetryPoint {
  id: number;
  motorId: string;
  runId: string;
  timestamp: string;
  loadPct: number;
  currentRms: number;
  fundamentalAmp: number;
  dominantFreq: number;
  currentThd: number;
  brbSidebandRatio: number;
  vibRms: number;
  vibKurtosis: number;
  vibPeakToPeak: number;
  vibBpfoEnergy: number;
  vib1xShaftAmp: number;
  temperatureC: number;
  tempRateOfRise: number;
  provenance: string;
}

export interface PredictionRecord {
  id: number;
  motorId: string;
  timestamp: string;
  isAnomaly: boolean;
  anomalyScore: number;
  predictedFaultClass: string;
  confidence: number;
  probabilitiesJson: string;
  estimatedRulHours: number | null;
  modelVersion: string;
}

export interface AlertRecord {
  id: number;
  motorId: string;
  timestamp: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  evidenceJson?: string;
  suggestedAction?: string;
  status: AlertStatus;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface SimulatorStatus {
  isRunning: boolean;
  motorId: string;
  scenario: string;
  severity: number;
  loadPct: number;
  ticksEmitted: number;
  currentTempC: number;
}

export interface SystemStatus {
  backendService: string;
  timestamp: string;
  registeredMotorsCount: number;
  totalTelemetryWindowsIngested: number;
  mlService: {
    status: string;
    anomaly_detector_loaded?: boolean;
    fault_classifier_loaded?: boolean;
    rul_model_loaded?: boolean;
    shap_explainer_loaded?: boolean;
    anomaly_version?: string;
    classifier_version?: string;
    rul_version?: string;
    feature_count?: number;
    provenance?: string;
    error?: string;
  };
}
