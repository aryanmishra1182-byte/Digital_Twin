package com.digitaltwin.motor.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
public class HealthController {

    @Value("${spring.application.name:motor-digital-twin-backend}")
    private String appName;

    @Value("${ml.service.url:http://localhost:8001}")
    private String mlServiceUrl;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", appName,
                "timestamp", Instant.now().toString(),
                "javaVersion", System.getProperty("java.version"),
                "mlServiceUrl", mlServiceUrl
        ));
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, Object>> readiness() {
        return ResponseEntity.ok(Map.of(
                "status", "READY",
                "database", "UP",
                "timestamp", Instant.now().toString()
        ));
    }
}
