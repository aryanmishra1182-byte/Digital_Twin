package com.digitaltwin.motor.repository;

import com.digitaltwin.motor.domain.ShapExplanationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShapExplanationRecordRepository extends JpaRepository<ShapExplanationRecord, Long> {
    Optional<ShapExplanationRecord> findFirstByMotorIdOrderByTimestampDesc(String motorId);
    Optional<ShapExplanationRecord> findByPredictionId(Long predictionId);
    List<ShapExplanationRecord> findTop10ByMotorIdOrderByTimestampDesc(String motorId);
}
