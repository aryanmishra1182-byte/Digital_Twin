package com.digitaltwin.motor.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "prediction_records", indexes = {
    @Index(name = "idx_pred_motor_time", columnList = "motorId, timestamp")
})
public class PredictionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String motorId;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    private boolean isAnomaly = false;
    private double anomalyScore = 0.0;

    @Column(length = 64)
    private String predictedFaultClass = "HEALTHY";
    private double confidence = 0.0;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String probabilitiesJson;

    private Double estimatedRulHours;
    private String modelVersion;

    public PredictionRecord() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMotorId() { return motorId; }
    public void setMotorId(String motorId) { this.motorId = motorId; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public boolean isAnomaly() { return isAnomaly; }
    public void setAnomaly(boolean anomaly) { isAnomaly = anomaly; }

    public double getAnomalyScore() { return anomalyScore; }
    public void setAnomalyScore(double anomalyScore) { this.anomalyScore = anomalyScore; }

    public String getPredictedFaultClass() { return predictedFaultClass; }
    public void setPredictedFaultClass(String predictedFaultClass) { this.predictedFaultClass = predictedFaultClass; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }

    public String getProbabilitiesJson() { return probabilitiesJson; }
    public void setProbabilitiesJson(String probabilitiesJson) { this.probabilitiesJson = probabilitiesJson; }

    public Double getEstimatedRulHours() { return estimatedRulHours; }
    public void setEstimatedRulHours(Double estimatedRulHours) { this.estimatedRulHours = estimatedRulHours; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
}
