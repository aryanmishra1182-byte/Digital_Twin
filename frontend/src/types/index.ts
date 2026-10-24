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
  faultClass?: string;
  operatorNote?: string;
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

// User Authentication
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'RESEARCHER' | 'OPERATOR' | 'GUEST';
  organization?: string;
}

// AI4I 2020 Predictive Maintenance Benchmark Types
export interface Ai4iModelMetrics {
  test_accuracy: number;
  test_precision: number;
  test_recall: number;
  test_f1: number;
  test_roc_auc: number;
  confusion_matrix: number[][];
  cv_f1_mean: number;
  cv_f1_std: number;
  cv_roc_auc_mean: number;
}

export interface Ai4iBenchmarkMetrics {
  dataset_name: string;
  source_url: string;
  citation: string;
  license: string;
  total_instances: number;
  features_count: number;
  failure_count: number;
  healthy_count: number;
  class_imbalance_ratio: string;
  champion_model: string;
  champion_metrics?: Ai4iModelMetrics;
  model_comparison: Record<string, Ai4iModelMetrics>;
  shap_global_ranking: { feature: string; mean_abs_shap: number }[];
}

export interface Ai4iTestCase {
  udi: number;
  product_id: string;
  type: string;
  actual_failure: number;
  failure_mode: string;
  predicted_failure: number;
  failure_probability: number;
  features: {
    Air_temperature_K: number;
    Process_temperature_K: number;
    Rotational_speed_rpm: number;
    Torque_Nm: number;
    Tool_wear_min: number;
    Temp_difference_K: number;
    Mechanical_Power_W: number;
    Overstrain_Metric: number;
    Type_Code: number;
  };
  top_shap_attributions: {
    feature: string;
    value: number;
    shap_value: number;
    direction: string;
  }[];
}

export interface Ai4iPredictionResponse {
  is_failure_predicted: boolean;
  failure_probability: number;
  risk_level: 'LOW' | 'ELEVATED' | 'CRITICAL';
  recommendation: string;
  evidence: Record<string, number>;
  top_shap_attributions: {
    feature: string;
    value: number;
    shap_value: number;
    direction: string;
  }[];
  model_version: string;
  benchmark_dataset: string;
}

export interface CsvFieldGuideItem {
  column: string;
  description: string;
  unit: string;
  type: string;
  required: boolean;
  valid_range: string;
  example: number | string;
}

export interface CsvFieldGuideResponse {
  mode: string;
  name: string;
  description: string;
  fields: CsvFieldGuideItem[];
}

export interface CsvAnalysisRowResult {
  row_index: number;
  predicted_condition: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  top_shap_driver?: string;
  recommended_action: string;
  failure_probability?: number;
  input_data?: Record<string, any>;
  is_anomaly?: boolean;
  anomaly_score?: number;
  confidence?: number;
  estimated_rul_hours?: number;
}

export interface CsvAnalysisResponse {
  mode: 'ai4i' | 'motor';
  total_rows_received: number;
  valid_rows_count: number;
  validation_errors: { row_index: number; column?: string; error: string }[];
  analysis_results: CsvAnalysisRowResult[];
  export_csv_content: string;
}

