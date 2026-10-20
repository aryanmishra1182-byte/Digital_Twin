package com.digitaltwin.motor.dto;

import java.util.List;
import java.util.Map;

public class TelemetryIngestRequest {
    private String motorId;
    private String runId;
    private double loadPct = 100.0;
    private double temperatureC = 40.0;
    private Double prevTemperatureC;

    // Optional raw arrays (if sending 10 kHz time-series)
    private List<Double> currentSignal;
    private List<Double> vibrationSignal;

    // Optional pre-extracted features
    private Map<String, Double> features;

    public TelemetryIngestRequest() {}

    public String getMotorId() { return motorId; }
    public void setMotorId(String motorId) { this.motorId = motorId; }

    public String getRunId() { return runId; }
    public void setRunId(String runId) { this.runId = runId; }

    public double getLoadPct() { return loadPct; }
    public void setLoadPct(double loadPct) { this.loadPct = loadPct; }

    public double getTemperatureC() { return temperatureC; }
    public void setTemperatureC(double temperatureC) { this.temperatureC = temperatureC; }

    public Double getPrevTemperatureC() { return prevTemperatureC; }
    public void setPrevTemperatureC(Double prevTemperatureC) { this.prevTemperatureC = prevTemperatureC; }

    public List<Double> getCurrentSignal() { return currentSignal; }
    public void setCurrentSignal(List<Double> currentSignal) { this.currentSignal = currentSignal; }

    public List<Double> getVibrationSignal() { return vibrationSignal; }
    public void setVibrationSignal(List<Double> vibrationSignal) { this.vibrationSignal = vibrationSignal; }

    public Map<String, Double> getFeatures() { return features; }
    public void setFeatures(Map<String, Double> features) { this.features = features; }
}
