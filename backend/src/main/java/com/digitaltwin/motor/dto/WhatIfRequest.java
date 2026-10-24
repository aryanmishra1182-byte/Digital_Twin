package com.digitaltwin.motor.dto;

public class WhatIfRequest {
    private String motorId = "MOTOR-001";
    private double loadPct = 100.0;
    private String hypotheticalFault = "HEALTHY";
    private double hypotheticalSeverity = 0.0;
    private double ambientTempC = 25.0;

    public WhatIfRequest() {}

    public String getMotorId() { return motorId; }
    public void setMotorId(String motorId) { this.motorId = motorId; }
    public double getLoadPct() { return loadPct; }
    public void setLoadPct(double loadPct) { this.loadPct = loadPct; }
    public String getHypotheticalFault() { return hypotheticalFault; }
    public void setHypotheticalFault(String hypotheticalFault) { this.hypotheticalFault = hypotheticalFault; }
    public double getHypotheticalSeverity() { return hypotheticalSeverity; }
    public void setHypotheticalSeverity(double hypotheticalSeverity) { this.hypotheticalSeverity = hypotheticalSeverity; }
    public double getAmbientTempC() { return ambientTempC; }
    public void setAmbientTempC(double ambientTempC) { this.ambientTempC = ambientTempC; }
}
