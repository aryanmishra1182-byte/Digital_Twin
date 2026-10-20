package com.digitaltwin.motor.dto;

public class MotorRegistrationRequest {
    private String id;
    private String name;
    private double ratedPowerKw = 3.0;
    private double supplyVoltageV = 415.0;
    private double supplyFreqHz = 50.0;
    private int poles = 4;
    private double ratedSpeedRpm = 1440.0;
    private double nominalSlip = 0.04;
    private String location = "Plant Unit 1";

    public MotorRegistrationRequest() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getRatedPowerKw() { return ratedPowerKw; }
    public void setRatedPowerKw(double ratedPowerKw) { this.ratedPowerKw = ratedPowerKw; }

    public double getSupplyVoltageV() { return supplyVoltageV; }
    public void setSupplyVoltageV(double supplyVoltageV) { this.supplyVoltageV = supplyVoltageV; }

    public double getSupplyFreqHz() { return supplyFreqHz; }
    public void setSupplyFreqHz(double supplyFreqHz) { this.supplyFreqHz = supplyFreqHz; }

    public int getPoles() { return poles; }
    public void setPoles(int poles) { this.poles = poles; }

    public double getRatedSpeedRpm() { return ratedSpeedRpm; }
    public void setRatedSpeedRpm(double ratedSpeedRpm) { this.ratedSpeedRpm = ratedSpeedRpm; }

    public double getNominalSlip() { return nominalSlip; }
    public void setNominalSlip(double nominalSlip) { this.nominalSlip = nominalSlip; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
}
