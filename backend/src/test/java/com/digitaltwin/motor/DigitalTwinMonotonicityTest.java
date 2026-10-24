package com.digitaltwin.motor;

import com.digitaltwin.motor.dto.DigitalTwinResponse;
import com.digitaltwin.motor.dto.WhatIfRequest;
import com.digitaltwin.motor.repository.*;
import com.digitaltwin.motor.service.DigitalTwinService;
import com.digitaltwin.motor.service.MaintenanceAdvisoryService;
import com.digitaltwin.motor.service.MlInferenceClientService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;

public class DigitalTwinMonotonicityTest {

    private DigitalTwinService digitalTwinService;

    @BeforeEach
    void setUp() {
        MotorRepository motorRepository = Mockito.mock(MotorRepository.class);
        MotorTwinStateRepository twinStateRepository = Mockito.mock(MotorTwinStateRepository.class);
        TelemetryMeasurementRepository telemetryRepository = Mockito.mock(TelemetryMeasurementRepository.class);
        PredictionRecordRepository predictionRepository = Mockito.mock(PredictionRecordRepository.class);
        ShapExplanationRecordRepository shapRepository = Mockito.mock(ShapExplanationRecordRepository.class);
        AlertRecordRepository alertRepository = Mockito.mock(AlertRecordRepository.class);
        MlInferenceClientService mlClient = Mockito.mock(MlInferenceClientService.class);
        MaintenanceAdvisoryService advisoryService = new MaintenanceAdvisoryService();
        ObjectMapper objectMapper = new ObjectMapper();

        digitalTwinService = new DigitalTwinService(
                motorRepository, twinStateRepository, telemetryRepository,
                predictionRepository, shapRepository, alertRepository,
                mlClient, advisoryService, objectMapper
        );
    }

    @Test
    @DisplayName("Health Score must strictly monotonically decrease as fault severity increases")
    void testHealthScoreMonotonicallyDecreasesWithSeverity() {
        double[] severities = {0.0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0};
        double previousHealth = Double.MAX_VALUE;

        for (double sev : severities) {
            WhatIfRequest req = new WhatIfRequest();
            req.setMotorId("MOTOR-001");
            req.setLoadPct(100.0);
            req.setHypotheticalFault("BEARING_DEFECT");
            req.setHypotheticalSeverity(sev);

            DigitalTwinResponse resp = digitalTwinService.simulateWhatIf(req);
            double currentHealth = resp.getHealthScore();

            assertTrue(
                    currentHealth <= previousHealth,
                    String.format("Health score did not decrease monotonically at severity %.2f: prev=%.1f, curr=%.1f",
                            sev, previousHealth, currentHealth)
            );
            previousHealth = currentHealth;
        }
    }

    @Test
    @DisplayName("Alert Hysteresis must require at least 2 consecutive anomalous windows to trigger warning/critical")
    void testAlertHysteresisSuppressesSingleTransientSpike() {
        MaintenanceAdvisoryService advisory = new MaintenanceAdvisoryService();
        String motorId = "MOTOR-HYST-01";

        // Window 1: normal
        var rec1 = advisory.generateRecommendationWithHysteresis(motorId, "HEALTHY", false, 0.05, 0.95, 5.8, 0.4, 3.0, 45.0);
        assertEquals("P3_INFO", rec1.get("severity").toString());

        // Window 2: single transient spike (anomalous window 1)
        var rec2 = advisory.generateRecommendationWithHysteresis(motorId, "BEARING_DEFECT", true, 0.88, 0.90, 6.2, 3.2, 8.5, 50.0);
        // Hysteresis holds state at previous severity (P3_INFO)
        assertEquals("P3_INFO", rec2.get("severity").toString(), "Single spike must be suppressed by hysteresis");

        // Window 3: sustained anomaly (anomalous window 2)
        var rec3 = advisory.generateRecommendationWithHysteresis(motorId, "BEARING_DEFECT", true, 0.92, 0.93, 6.3, 3.4, 9.1, 52.0);
        assertEquals("P1_CRITICAL", rec3.get("severity").toString(), "Sustained anomaly must trigger alert");
    }
}
