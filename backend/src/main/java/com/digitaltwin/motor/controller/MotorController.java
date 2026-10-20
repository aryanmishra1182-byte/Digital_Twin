package com.digitaltwin.motor.controller;

import com.digitaltwin.motor.domain.Motor;
import com.digitaltwin.motor.dto.MotorRegistrationRequest;
import com.digitaltwin.motor.service.MotorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/motors")
@CrossOrigin(origins = "*")
public class MotorController {

    private final MotorService motorService;

    public MotorController(MotorService motorService) {
        this.motorService = motorService;
    }

    @GetMapping
    public ResponseEntity<List<Motor>> getAllMotors() {
        return ResponseEntity.ok(motorService.getAllMotors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Motor> getMotorById(@PathVariable String id) {
        return motorService.getMotor(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Motor> registerMotor(@RequestBody MotorRegistrationRequest req) {
        return ResponseEntity.ok(motorService.registerMotor(req));
    }
}
