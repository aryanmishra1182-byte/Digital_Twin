package com.digitaltwin.motor.repository;

import com.digitaltwin.motor.domain.MotorTwinState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MotorTwinStateRepository extends JpaRepository<MotorTwinState, String> {
    Optional<MotorTwinState> findByMotorId(String motorId);
}
