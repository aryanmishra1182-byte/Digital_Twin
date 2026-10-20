package com.digitaltwin.motor.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "motor_twin_states")
public class MotorTwinState {

    @Id
    @Column(nullable = false, unique = true, length = 64)
    private String motorId;

    @Column(nullable = false)
    private Instant lastUpdated = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OperationalState operationalState = OperationalState.HEALTHY;

    // Health Score: 0.0 to 100.0 (documented formula based on anomaly score, fault probabilities & thermal stress)
    private double healthScore = 100.0;

    private boolean isAnomaly = false;
    private double anomalyScore = 0.0;

    @Column(length = 64)
    private String predictedFaultClass = "HEALTHY";
    private double confidence = 1.0;

    private Double estimatedRulHours;
    private String rulUnit = "hours";

    // Latest telemetry summary
    private double latestCurrentRms = 5.8;
    private double latestVibRms = 0.45;
    private double latestVibKurtosis = 0.05;
    private double latestTemperatureC = 42.0;
    private double latestLoadPct = 100.0;
    private double latestEstimatedSpeedRpm = 1440.0;

    private int activeAlertCount = 0;
    private String modelVersion = "v1.0";

    public MotorTwinState() {}

    public MotorTwinState(String motorId) {
        this.motorId = motorId;
        this.lastUpdated = Instant.now();
    }

    public String getMotorId() { return motorId; }
    public void setMotorId(String motorId) { this.motorId = motorId; }

    public Instant getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(Instant lastUpdated) { this.lastUpdated = lastUpdated; }

    public OperationalState getOperationalState() { return operationalState; }
    public void setOperationalState(OperationalState operationalState) { this.operationalState = operationalState; }

    public double getHealthScore() { return healthScore; }
    public void setHealthScore(double healthScore) { this.healthScore = healthScore; }

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

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
}
