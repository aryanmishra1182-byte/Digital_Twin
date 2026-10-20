package com.digitaltwin.motor.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "shap_explanation_records")
public class ShapExplanationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long predictionId;

    @Column(nullable = false, length = 64)
    private String motorId;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    @Column(length = 64)
    private String predictedClass;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String topAttributionsJson;

    private String explanationMethod = "SHAP TreeExplainer";

    public ShapExplanationRecord() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPredictionId() { return predictionId; }
    public void setPredictionId(Long predictionId) { this.predictionId = predictionId; }

    public String getMotorId() { return motorId; }
    public void setMotorId(String motorId) { this.motorId = motorId; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getPredictedClass() { return predictedClass; }
    public void setPredictedClass(String predictedClass) { this.predictedClass = predictedClass; }

    public String getTopAttributionsJson() { return topAttributionsJson; }
    public void setTopAttributionsJson(String topAttributionsJson) { this.topAttributionsJson = topAttributionsJson; }

    public String getExplanationMethod() { return explanationMethod; }
    public void setExplanationMethod(String explanationMethod) { this.explanationMethod = explanationMethod; }
}
