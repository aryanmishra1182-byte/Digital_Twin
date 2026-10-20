package com.digitaltwin.motor.controller;

import com.digitaltwin.motor.domain.AlertRecord;
import com.digitaltwin.motor.domain.AlertStatus;
import com.digitaltwin.motor.dto.AlertActionRequest;
import com.digitaltwin.motor.repository.AlertRecordRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts")
@CrossOrigin(origins = "*")
public class AlertController {

    private final AlertRecordRepository alertRepository;

    public AlertController(AlertRecordRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    @GetMapping
    public ResponseEntity<List<AlertRecord>> getAlerts(
            @RequestParam(required = false) String motorId,
            @RequestParam(required = false) AlertStatus status,
            @RequestParam(defaultValue = "50") int limit
    ) {
        int boundedLimit = Math.max(1, Math.min(200, limit));
        if (motorId != null && !motorId.isBlank()) {
            return ResponseEntity.ok(alertRepository.findByMotorIdOrderByTimestampDesc(motorId, PageRequest.of(0, boundedLimit)));
        }
        if (status != null) {
            return ResponseEntity.ok(alertRepository.findByStatusOrderByTimestampDesc(status));
        }
        return ResponseEntity.ok(alertRepository.findAllByOrderByTimestampDesc(PageRequest.of(0, boundedLimit)));
    }

    @PutMapping("/{id}/acknowledge")
    public ResponseEntity<AlertRecord> acknowledgeAlert(
            @PathVariable Long id,
            @RequestBody(required = false) AlertActionRequest request
    ) {
        return alertRepository.findById(id).map(alert -> {
            alert.setStatus(AlertStatus.ACKNOWLEDGED);
            alert.setAcknowledgedAt(Instant.now());
            if (request != null && request.getOperatorNote() != null) {
                alert.setDescription(alert.getDescription() + " | Acknowledged note: " + request.getOperatorNote());
            }
            return ResponseEntity.ok(alertRepository.save(alert));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<AlertRecord> resolveAlert(
            @PathVariable Long id,
            @RequestBody(required = false) AlertActionRequest request
    ) {
        return alertRepository.findById(id).map(alert -> {
            alert.setStatus(AlertStatus.RESOLVED);
            alert.setResolvedAt(Instant.now());
            if (request != null && request.getOperatorNote() != null) {
                alert.setDescription(alert.getDescription() + " | Resolution note: " + request.getOperatorNote());
            }
            return ResponseEntity.ok(alertRepository.save(alert));
        }).orElse(ResponseEntity.notFound().build());
    }
}
