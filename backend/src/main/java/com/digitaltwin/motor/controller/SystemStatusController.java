package com.digitaltwin.motor.controller;

import com.digitaltwin.motor.repository.MotorRepository;
import com.digitaltwin.motor.repository.TelemetryMeasurementRepository;
import com.digitaltwin.motor.service.MlInferenceClientService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/status")
@CrossOrigin(origins = "*")
public class SystemStatusController {

    private final MlInferenceClientService mlClient;
    private final MotorRepository motorRepository;
    private final TelemetryMeasurementRepository telemetryRepository;

    public SystemStatusController(
            MlInferenceClientService mlClient,
            MotorRepository motorRepository,
            TelemetryMeasurementRepository telemetryRepository
    ) {
        this.mlClient = mlClient;
        this.motorRepository = motorRepository;
        this.telemetryRepository = telemetryRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getSystemStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("backendService", "UP");
        status.put("timestamp", Instant.now().toString());
        status.put("registeredMotorsCount", motorRepository.count());
        status.put("totalTelemetryWindowsIngested", telemetryRepository.count());

        Map<String, Object> mlStatus = mlClient.checkHealth();
        status.put("mlService", mlStatus);

        return ResponseEntity.ok(status);
    }
}
