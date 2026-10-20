package com.digitaltwin.motor.controller;

import com.digitaltwin.motor.dto.DigitalTwinResponse;
import com.digitaltwin.motor.service.DigitalTwinService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/twin")
@CrossOrigin(origins = "*")
public class DigitalTwinController {

    private final DigitalTwinService digitalTwinService;

    public DigitalTwinController(DigitalTwinService digitalTwinService) {
        this.digitalTwinService = digitalTwinService;
    }

    @GetMapping
    public ResponseEntity<List<DigitalTwinResponse>> getAllTwinStates() {
        return ResponseEntity.ok(digitalTwinService.getAllTwinStates());
    }

    @GetMapping("/{motorId}")
    public ResponseEntity<DigitalTwinResponse> getTwinState(@PathVariable String motorId) {
        return ResponseEntity.ok(digitalTwinService.getTwinState(motorId));
    }
}
