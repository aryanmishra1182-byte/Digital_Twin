package com.digitaltwin.motor.service;

import com.digitaltwin.motor.domain.Motor;
import com.digitaltwin.motor.domain.MotorTwinState;
import com.digitaltwin.motor.dto.MotorRegistrationRequest;
import com.digitaltwin.motor.repository.MotorRepository;
import com.digitaltwin.motor.repository.MotorTwinStateRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MotorService {

    private final MotorRepository motorRepository;
    private final MotorTwinStateRepository twinStateRepository;

    public MotorService(MotorRepository motorRepository, MotorTwinStateRepository twinStateRepository) {
        this.motorRepository = motorRepository;
        this.twinStateRepository = twinStateRepository;
    }

    @PostConstruct
    public void seedInitialMotors() {
        if (motorRepository.count() == 0) {
            // Seed MOTOR-001 (Main 3kW Squirrel-Cage Motor from Research Paper)
            Motor m1 = new Motor(
                    "MOTOR-001",
                    "3-Phase Squirrel Cage Induction Motor (Primary Feed Pump)",
                    3.0, 415.0, 50.0, 4, 1440.0, 0.04,
                    "Manufacturing Plant - Line A"
            );
            motorRepository.save(m1);
            twinStateRepository.save(new MotorTwinState("MOTOR-001"));

            // Seed MOTOR-002 (Cooling Fan Drive Motor)
            Motor m2 = new Motor(
                    "MOTOR-002",
                    "Cooling Tower Exhaust Fan Motor",
                    3.0, 415.0, 50.0, 4, 1440.0, 0.04,
                    "Utility Building - Unit 2"
            );
            motorRepository.save(m2);
            twinStateRepository.save(new MotorTwinState("MOTOR-002"));
        }
    }

    public List<Motor> getAllMotors() {
        return motorRepository.findAll();
    }

    public Optional<Motor> getMotor(String id) {
        return motorRepository.findById(id);
    }

    public Motor registerMotor(MotorRegistrationRequest req) {
        Motor motor = new Motor(
                req.getId(),
                req.getName(),
                req.getRatedPowerKw(),
                req.getSupplyVoltageV(),
                req.getSupplyFreqHz(),
                req.getPoles(),
                req.getRatedSpeedRpm(),
                req.getNominalSlip(),
                req.getLocation()
        );
        Motor saved = motorRepository.save(motor);
        if (twinStateRepository.findById(req.getId()).isEmpty()) {
            twinStateRepository.save(new MotorTwinState(req.getId()));
        }
        return saved;
    }
}
