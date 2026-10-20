package com.digitaltwin.motor.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "telemetry_measurements", indexes = {
    @Index(name = "idx_telemetry_motor_time", columnList = "motorId, timestamp")
})
public class TelemetryMeasurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String motorId;

    @Column(length = 64)
    private String runId;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    private double loadPct = 100.0;
    private double currentRms = 0.0;
    private double fundamentalAmp = 0.0;
    private double dominantFreq = 50.0;
    private double currentThd = 0.0;
    private double brbSidebandRatio = 0.0;

    private double vibRms = 0.0;
    private double vibKurtosis = 0.0;
    private double vibPeakToPeak = 0.0;
    private double vibBpfoEnergy = 0.0;
    private double vib1xShaftAmp = 0.0;

    private double temperatureC = 0.0;
    private double tempRateOfRise = 0.0;

    private String provenance = "Synthetic Simulation";

    public TelemetryMeasurement() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMotorId() { return motorId; }
    public void setMotorId(String motorId) { this.motorId = motorId; }

    public String getRunId() { return runId; }
    public void setRunId(String runId) { this.runId = runId; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public double getLoadPct() { return loadPct; }
    public void setLoadPct(double loadPct) { this.loadPct = loadPct; }

    public double getCurrentRms() { return currentRms; }
    public void setCurrentRms(double currentRms) { this.currentRms = currentRms; }

    public double getFundamentalAmp() { return fundamentalAmp; }
    public void setFundamentalAmp(double fundamentalAmp) { this.fundamentalAmp = fundamentalAmp; }

    public double getDominantFreq() { return dominantFreq; }
    public void setDominantFreq(double dominantFreq) { this.dominantFreq = dominantFreq; }

    public double getCurrentThd() { return currentThd; }
    public void setCurrentThd(double currentThd) { this.currentThd = currentThd; }

    public double getBrbSidebandRatio() { return brbSidebandRatio; }
    public void setBrbSidebandRatio(double brbSidebandRatio) { this.brbSidebandRatio = brbSidebandRatio; }

    public double getVibRms() { return vibRms; }
    public void setVibRms(double vibRms) { this.vibRms = vibRms; }

    public double getVibKurtosis() { return vibKurtosis; }
    public void setVibKurtosis(double vibKurtosis) { this.vibKurtosis = vibKurtosis; }

    public double getVibPeakToPeak() { return vibPeakToPeak; }
    public void setVibPeakToPeak(double vibPeakToPeak) { this.vibPeakToPeak = vibPeakToPeak; }

    public double getVibBpfoEnergy() { return vibBpfoEnergy; }
    public void setVibBpfoEnergy(double vibBpfoEnergy) { this.vibBpfoEnergy = vibBpfoEnergy; }

    public double getVib1xShaftAmp() { return vib1xShaftAmp; }
    public void setVib1xShaftAmp(double vib1xShaftAmp) { this.vib1xShaftAmp = vib1xShaftAmp; }

    public double getTemperatureC() { return temperatureC; }
    public void setTemperatureC(double temperatureC) { this.temperatureC = temperatureC; }

    public double getTempRateOfRise() { return tempRateOfRise; }
    public void setTempRateOfRise(double tempRateOfRise) { this.tempRateOfRise = tempRateOfRise; }

    public String getProvenance() { return provenance; }
    public void setProvenance(String provenance) { this.provenance = provenance; }
}
