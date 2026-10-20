package com.digitaltwin.motor.controller;

import com.digitaltwin.motor.domain.TelemetryMeasurement;
import com.digitaltwin.motor.dto.DigitalTwinResponse;
import com.digitaltwin.motor.dto.TelemetryIngestRequest;
import com.digitaltwin.motor.repository.TelemetryMeasurementRepository;
import com.digitaltwin.motor.service.DigitalTwinService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/telemetry")
@CrossOrigin(origins = "*")
public class TelemetryController {

    private final DigitalTwinService digitalTwinService;
    private final TelemetryMeasurementRepository telemetryRepository;

    public TelemetryController(DigitalTwinService digitalTwinService, TelemetryMeasurementRepository telemetryRepository) {
        this.digitalTwinService = digitalTwinService;
        this.telemetryRepository = telemetryRepository;
    }

    @PostMapping("/ingest")
    public ResponseEntity<DigitalTwinResponse> ingestTelemetry(@RequestBody TelemetryIngestRequest request) {
        return ResponseEntity.ok(digitalTwinService.processTelemetry(request));
    }

    @GetMapping("/history/{motorId}")
    public ResponseEntity<List<TelemetryMeasurement>> getHistory(
            @PathVariable String motorId,
            @RequestParam(defaultValue = "30") int limit
    ) {
        int boundedLimit = Math.max(1, Math.min(200, limit));
        List<TelemetryMeasurement> measurements = telemetryRepository.findByMotorIdOrderByTimestampDesc(
                motorId, PageRequest.of(0, boundedLimit)
        );
        return ResponseEntity.ok(measurements);
    }
}
