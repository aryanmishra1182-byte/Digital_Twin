package com.digitaltwin.motor.repository;

import com.digitaltwin.motor.domain.Motor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MotorRepository extends JpaRepository<Motor, String> {
}
