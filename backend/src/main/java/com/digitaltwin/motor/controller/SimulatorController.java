package com.digitaltwin.motor.controller;

import com.digitaltwin.motor.service.SimulatorOrchestrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/simulator")
@CrossOrigin(origins = "*")
public class SimulatorController {

    private final SimulatorOrchestrationService simulatorService;

    public SimulatorController(SimulatorOrchestrationService simulatorService) {
        this.simulatorService = simulatorService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(simulatorService.getStatus());
    }

    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> start(
            @RequestParam(defaultValue = "MOTOR-001") String motorId,
            @RequestParam(defaultValue = "HEALTHY") String scenario,
            @RequestParam(defaultValue = "0.0") double severity,
            @RequestParam(defaultValue = "100.0") double loadPct
    ) {
        return ResponseEntity.ok(simulatorService.start(motorId, scenario, severity, loadPct));
    }

    @PostMapping("/stop")
    public ResponseEntity<Map<String, Object>> stop() {
        return ResponseEntity.ok(simulatorService.stop());
    }
}
