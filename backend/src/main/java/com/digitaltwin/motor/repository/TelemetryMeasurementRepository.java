package com.digitaltwin.motor.repository;

import com.digitaltwin.motor.domain.TelemetryMeasurement;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface TelemetryMeasurementRepository extends JpaRepository<TelemetryMeasurement, Long> {
    List<TelemetryMeasurement> findByMotorIdOrderByTimestampDesc(String motorId, Pageable pageable);
    List<TelemetryMeasurement> findByMotorIdAndTimestampBetweenOrderByTimestampAsc(String motorId, Instant start, Instant end);
    long countByMotorId(String motorId);
}
