package com.digitaltwin.motor.service;

import com.digitaltwin.motor.dto.TelemetryIngestRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class SimulatorOrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(SimulatorOrchestrationService.class);

    private final DigitalTwinService digitalTwinService;
    private final MlInferenceClientService mlClient;

    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    private final AtomicReference<String> activeMotorId = new AtomicReference<>("MOTOR-001");
    private final AtomicReference<String> activeScenario = new AtomicReference<>("HEALTHY");
    private final AtomicReference<Double> activeSeverity = new AtomicReference<>(0.0);
    private final AtomicReference<Double> activeLoad = new AtomicReference<>(100.0);
    private final AtomicInteger tickCount = new AtomicInteger(0);

    private double currentTemp = 42.0;

    public SimulatorOrchestrationService(DigitalTwinService digitalTwinService, MlInferenceClientService mlClient) {
        this.digitalTwinService = digitalTwinService;
        this.mlClient = mlClient;
    }

    public synchronized Map<String, Object> start(String motorId, String scenario, double severity, double loadPct) {
        this.activeMotorId.set(motorId != null ? motorId : "MOTOR-001");
        this.activeScenario.set(scenario != null ? scenario : "HEALTHY");
        this.activeSeverity.set(Math.max(0.0, Math.min(1.0, severity)));
        this.activeLoad.set(loadPct > 0 ? loadPct : 100.0);
        this.tickCount.set(0);
        this.isRunning.set(true);
        log.info("Started Live Telemetry Simulator for motor={}, scenario={}, severity={}, load={}%",
                activeMotorId.get(), activeScenario.get(), activeSeverity.get(), activeLoad.get());

        return getStatus();
    }

    public synchronized Map<String, Object> stop() {
        this.isRunning.set(false);
        log.info("Stopped Live Telemetry Simulator");
        return getStatus();
    }

    public Map<String, Object> getStatus() {
        return Map.of(
                "isRunning", isRunning.get(),
                "motorId", activeMotorId.get(),
                "scenario", activeScenario.get(),
                "severity", activeSeverity.get(),
                "loadPct", activeLoad.get(),
                "ticksEmitted", tickCount.get(),
                "currentTempC", Math.round(currentTemp * 10.0) / 10.0
        );
    }

    // Ticks every 3 seconds when simulator is enabled
    @Scheduled(fixedRate = 3000)
    public void simulationTick() {
        if (!isRunning.get()) {
            return;
        }

        try {
            int tick = tickCount.incrementAndGet();
            String motorId = activeMotorId.get();
            String scenario = activeScenario.get();
            double severity = activeSeverity.get();
            double load = activeLoad.get();

            // Thermal gradual rise
            double steadyTemp = 25.0 + Math.pow(load / 100.0, 2) * 40.0;
            if ("STATOR_INTER_TURN_SHORT".equalsIgnoreCase(scenario)) {
                steadyTemp += 35.0 * severity;
            } else if (!"HEALTHY".equalsIgnoreCase(scenario)) {
                steadyTemp += 12.0 * severity;
            }
            double prevTemp = currentTemp;
            currentTemp += (steadyTemp - currentTemp) * 0.08;

            // Generate synthetic feature vector based on physics equations
            Map<String, Double> features = generateSyntheticFeatures(scenario, severity, load, currentTemp, prevTemp);

            TelemetryIngestRequest req = new TelemetryIngestRequest();
            req.setMotorId(motorId);
            req.setRunId("LIVE-SIM-" + tick);
            req.setLoadPct(load);
            req.setTemperatureC(Math.round(currentTemp * 100.0) / 100.0);
            req.setPrevTemperatureC(prevTemp);
            req.setFeatures(features);

            digitalTwinService.processTelemetry(req);
        } catch (Exception e) {
            log.error("Simulation tick error: {}", e.getMessage());
        }
    }

    private Map<String, Double> generateSyntheticFeatures(String scenario, double severity, double loadPct, double tempC, double prevTemp) {
        Map<String, Double> f = new HashMap<>();
        Random rnd = new Random();

        double slip = 0.04 * (loadPct / 100.0);
        double speedRpm = 1500.0 * (1.0 - slip);
        double baseCurrentRms = 5.8 * (0.3 + 0.7 * (loadPct / 100.0));
        double fundAmp = baseCurrentRms * Math.sqrt(2.0);

        f.put("current_rms", baseCurrentRms + (rnd.nextDouble() - 0.5) * 0.1);
        f.put("current_fundamental_amp", fundAmp);
        f.put("current_dominant_freq", 50.0);
        f.put("current_thd", 0.02 + rnd.nextDouble() * 0.01);
        f.put("current_harm_3_ratio", 0.015 + rnd.nextDouble() * 0.005);
        f.put("current_harm_5_ratio", 0.008 + rnd.nextDouble() * 0.003);
        f.put("brb_left_sideband_amp", 0.05 + rnd.nextDouble() * 0.02);
        f.put("brb_right_sideband_amp", 0.05 + rnd.nextDouble() * 0.02);
        f.put("brb_sideband_ratio", 0.008);
        f.put("eccentricity_sideband_amp", 0.04 + rnd.nextDouble() * 0.02);

        f.put("vib_rms", 0.45 * (loadPct / 100.0) + rnd.nextDouble() * 0.05);
        f.put("vib_std", 0.44);
        f.put("vib_peak", 0.8 + rnd.nextDouble() * 0.1);
        f.put("vib_peak_to_peak", 1.6 + rnd.nextDouble() * 0.2);
        f.put("vib_crest_factor", 1.8 + rnd.nextDouble() * 0.2);
        f.put("vib_kurtosis", -0.05 + rnd.nextDouble() * 0.1);
        f.put("vib_skewness", 0.02 + (rnd.nextDouble() - 0.5) * 0.05);
        f.put("vib_bpfo_energy", 0.1 + rnd.nextDouble() * 0.05);
        f.put("vib_bpfi_energy", 0.08 + rnd.nextDouble() * 0.04);
        f.put("vib_1x_shaft_amp", 0.35 + rnd.nextDouble() * 0.05);

        f.put("temp_mean", tempC);
        f.put("temp_max", tempC + 0.2);
        f.put("temp_rate_of_rise", (tempC - prevTemp) * 20.0);
        f.put("load_pct", loadPct);
        f.put("estimated_speed_rpm", speedRpm);
        f.put("estimated_slip", slip);

        // Inject fault signatures
        switch (scenario.toUpperCase()) {
            case "BROKEN_ROTOR_BAR" -> {
                double sbAmp = fundAmp * (0.05 + 0.12 * severity);
                f.put("brb_left_sideband_amp", sbAmp);
                f.put("brb_right_sideband_amp", sbAmp);
                f.put("brb_sideband_ratio", sbAmp / fundAmp);
            }
            case "STATOR_INTER_TURN_SHORT" -> {
                f.put("current_harm_3_ratio", 0.08 + 0.22 * severity);
                f.put("current_thd", 0.10 + 0.25 * severity);
                f.put("current_rms", baseCurrentRms * (1.0 + 0.12 * severity));
            }
            case "BEARING_DEFECT" -> {
                f.put("vib_kurtosis", 3.2 + 8.5 * severity);
                f.put("vib_crest_factor", 3.5 + 4.0 * severity);
                f.put("vib_bpfo_energy", 2.5 + 9.0 * severity);
                f.put("vib_rms", 1.2 + 2.5 * severity);
            }
            case "AIR_GAP_ECCENTRICITY" -> {
                f.put("vib_1x_shaft_amp", 1.2 + 2.8 * severity);
                f.put("eccentricity_sideband_amp", 0.6 + 1.8 * severity);
                f.put("vib_peak_to_peak", 3.0 + 5.0 * severity);
            }
        }

        return f;
    }
}
