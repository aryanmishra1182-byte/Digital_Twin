package com.digitaltwin.motor.repository;

import com.digitaltwin.motor.domain.PredictionRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PredictionRecordRepository extends JpaRepository<PredictionRecord, Long> {
    List<PredictionRecord> findByMotorIdOrderByTimestampDesc(String motorId, Pageable pageable);
    Optional<PredictionRecord> findFirstByMotorIdOrderByTimestampDesc(String motorId);
}
