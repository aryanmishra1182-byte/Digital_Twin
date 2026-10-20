package com.digitaltwin.motor.repository;

import com.digitaltwin.motor.domain.AlertRecord;
import com.digitaltwin.motor.domain.AlertStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRecordRepository extends JpaRepository<AlertRecord, Long> {
    List<AlertRecord> findByMotorIdOrderByTimestampDesc(String motorId, Pageable pageable);
    List<AlertRecord> findByStatusOrderByTimestampDesc(AlertStatus status);
    List<AlertRecord> findAllByOrderByTimestampDesc(Pageable pageable);
    int countByMotorIdAndStatus(String motorId, AlertStatus status);
}
