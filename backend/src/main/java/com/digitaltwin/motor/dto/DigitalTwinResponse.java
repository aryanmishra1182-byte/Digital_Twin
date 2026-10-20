package com.digitaltwin.motor.dto;

import com.digitaltwin.motor.domain.Motor;
import com.digitaltwin.motor.domain.MotorTwinState;
import com.digitaltwin.motor.domain.OperationalState;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class DigitalTwinResponse {
    private String motorId;
    private String motorName;
    private Motor configuration;
    private Instant lastUpdated;
    private OperationalState operationalState;
    private double healthScore;
    @com.fasterxml.jackson.annotation.JsonProperty("isAnomaly")
    private boolean isAnomaly;
    private double anomalyScore;
    private String predictedFaultClass;
    private double confidence;
    private Double estimatedRulHours;
    private String rulUnit;

    private double latestCurrentRms;
    private double latestVibRms;
    private double latestVibKurtosis;
    private double latestTemperatureC;
    private double latestLoadPct;
    private double latestEstimatedSpeedRpm;
    private int activeAlertCount;

    private Map<String, Double> classProbabilities;
    private List<Map<String, Object>> topShapAttributions;
    private Map<String, Object> latestMaintenanceRecommendation;

    public DigitalTwinResponse() {}

    public static DigitalTwinResponse from(Motor motor, MotorTwinState state) {
        DigitalTwinResponse res = new DigitalTwinResponse();
        res.setMotorId(state.getMotorId());
        res.setMotorName(motor != null ? motor.getName() : state.getMotorId());
        res.setConfiguration(motor);
        res.setLastUpdated(state.getLastUpdated());
        res.setOperationalState(state.getOperationalState());
        res.setHealthScore(state.getHealthScore());
        res.setAnomaly(state.isAnomaly());
        res.setAnomalyScore(state.getAnomalyScore());
        res.setPredictedFaultClass(state.getPredictedFaultClass());
        res.setConfidence(state.getConfidence());
        res.setEstimatedRulHours(state.getEstimatedRulHours());
        res.setRulUnit(state.getRulUnit());
        res.setLatestCurrentRms(state.getLatestCurrentRms());
        res.setLatestVibRms(state.getLatestVibRms());
        res.setLatestVibKurtosis(state.getLatestVibKurtosis());
        res.setLatestTemperatureC(state.getLatestTemperatureC());
        res.setLatestLoadPct(state.getLatestLoadPct());
        res.setLatestEstimatedSpeedRpm(state.getLatestEstimatedSpeedRpm());
        res.setActiveAlertCount(state.getActiveAlertCount());
        return res;
    }

    public String getMotorId() { return motorId; }
    public void setMotorId(String motorId) { this.motorId = motorId; }

    public String getMotorName() { return motorName; }
    public void setMotorName(String motorName) { this.motorName = motorName; }

    public Motor getConfiguration() { return configuration; }
    public void setConfiguration(Motor configuration) { this.configuration = configuration; }

    public Instant getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(Instant lastUpdated) { this.lastUpdated = lastUpdated; }

    public OperationalState getOperationalState() { return operationalState; }
    public void setOperationalState(OperationalState operationalState) { this.operationalState = operationalState; }

    public double getHealthScore() { return healthScore; }
    public void setHealthScore(double healthScore) { this.healthScore = healthScore; }

    @com.fasterxml.jackson.annotation.JsonProperty("isAnomaly")
    public boolean isAnomaly() { return isAnomaly; }
    public void setAnomaly(boolean anomaly) { isAnomaly = anomaly; }

    public double getAnomalyScore() { return anomalyScore; }
    public void setAnomalyScore(double anomalyScore) { this.anomalyScore = anomalyScore; }

    public String getPredictedFaultClass() { return predictedFaultClass; }
    public void setPredictedFaultClass(String predictedFaultClass) { this.predictedFaultClass = predictedFaultClass; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }

    public Double getEstimatedRulHours() { return estimatedRulHours; }
    public void setEstimatedRulHours(Double estimatedRulHours) { this.estimatedRulHours = estimatedRulHours; }

    public String getRulUnit() { return rulUnit; }
    public void setRulUnit(String rulUnit) { this.rulUnit = rulUnit; }

    public double getLatestCurrentRms() { return latestCurrentRms; }
    public void setLatestCurrentRms(double latestCurrentRms) { this.latestCurrentRms = latestCurrentRms; }

    public double getLatestVibRms() { return latestVibRms; }
    public void setLatestVibRms(double latestVibRms) { this.latestVibRms = latestVibRms; }

    public double getLatestVibKurtosis() { return latestVibKurtosis; }
    public void setLatestVibKurtosis(double latestVibKurtosis) { this.latestVibKurtosis = latestVibKurtosis; }

    public double getLatestTemperatureC() { return latestTemperatureC; }
    public void setLatestTemperatureC(double latestTemperatureC) { this.latestTemperatureC = latestTemperatureC; }

    public double getLatestLoadPct() { return latestLoadPct; }
    public void setLatestLoadPct(double latestLoadPct) { this.latestLoadPct = latestLoadPct; }

    public double getLatestEstimatedSpeedRpm() { return latestEstimatedSpeedRpm; }
    public void setLatestEstimatedSpeedRpm(double latestEstimatedSpeedRpm) { this.latestEstimatedSpeedRpm = latestEstimatedSpeedRpm; }

    public int getActiveAlertCount() { return activeAlertCount; }
    public void setActiveAlertCount(int activeAlertCount) { this.activeAlertCount = activeAlertCount; }

    public Map<String, Double> getClassProbabilities() { return classProbabilities; }
    public void setClassProbabilities(Map<String, Double> classProbabilities) { this.classProbabilities = classProbabilities; }

    public List<Map<String, Object>> getTopShapAttributions() { return topShapAttributions; }
    public void setTopShapAttributions(List<Map<String, Object>> topShapAttributions) { this.topShapAttributions = topShapAttributions; }

    public Map<String, Object> getLatestMaintenanceRecommendation() { return latestMaintenanceRecommendation; }
    public void setLatestMaintenanceRecommendation(Map<String, Object> latestMaintenanceRecommendation) { this.latestMaintenanceRecommendation = latestMaintenanceRecommendation; }
}
