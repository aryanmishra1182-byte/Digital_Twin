package com.digitaltwin.motor.service;

import com.digitaltwin.motor.domain.*;
import com.digitaltwin.motor.dto.DigitalTwinResponse;
import com.digitaltwin.motor.dto.TelemetryIngestRequest;
import com.digitaltwin.motor.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DigitalTwinService {

    private static final Logger log = LoggerFactory.getLogger(DigitalTwinService.class);

    private final MotorRepository motorRepository;
    private final MotorTwinStateRepository twinStateRepository;
    private final TelemetryMeasurementRepository telemetryRepository;
    private final PredictionRecordRepository predictionRepository;
    private final ShapExplanationRecordRepository shapRepository;
    private final AlertRecordRepository alertRepository;
    private final MlInferenceClientService mlClient;
    private final MaintenanceAdvisoryService advisoryService;
    private final ObjectMapper objectMapper;

    // Rolling window buffer per motor for LSTM sequence RUL estimation (up to 10 recent windows)
    private final Map<String, List<Map<String, Double>>> rollingFeatureBuffers = new ConcurrentHashMap<>();

    public DigitalTwinService(
            MotorRepository motorRepository,
            MotorTwinStateRepository twinStateRepository,
            TelemetryMeasurementRepository telemetryRepository,
            PredictionRecordRepository predictionRepository,
            ShapExplanationRecordRepository shapRepository,
            AlertRecordRepository alertRepository,
            MlInferenceClientService mlClient,
            MaintenanceAdvisoryService advisoryService,
            ObjectMapper objectMapper
    ) {
        this.motorRepository = motorRepository;
        this.twinStateRepository = twinStateRepository;
        this.telemetryRepository = telemetryRepository;
        this.predictionRepository = predictionRepository;
        this.shapRepository = shapRepository;
        this.alertRepository = alertRepository;
        this.mlClient = mlClient;
        this.advisoryService = advisoryService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public DigitalTwinResponse processTelemetry(TelemetryIngestRequest request) {
        String motorId = request.getMotorId();
        if (motorId == null || motorId.isBlank()) {
            throw new IllegalArgumentException("motorId is required");
        }

        // Ensure Motor exists or create default
        Motor motor = motorRepository.findById(motorId).orElseGet(() -> {
            Motor newMotor = new Motor(motorId, "Three-Phase Induction Motor " + motorId, 3.0, 415.0, 50.0, 4, 1440.0, 0.04, "Production Floor Unit 1");
            return motorRepository.save(newMotor);
        });

        // 1. Resolve features
        Map<String, Double> features;
        if (request.getFeatures() != null && !request.getFeatures().isEmpty()) {
            features = request.getFeatures();
        } else if (request.getCurrentSignal() != null && request.getVibrationSignal() != null) {
            Map<String, Object> rawPayload = new HashMap<>();
            rawPayload.put("current_signal", request.getCurrentSignal());
            rawPayload.put("vibration_signal", request.getVibrationSignal());
            rawPayload.put("temperature_c", request.getTemperatureC());
            rawPayload.put("prev_temperature_c", request.getPrevTemperatureC());
            rawPayload.put("load_pct", request.getLoadPct());
            features = mlClient.extractFeatures(rawPayload);
        } else {
            throw new IllegalArgumentException("Either 'features' map or 'currentSignal' + 'vibrationSignal' must be provided.");
        }

        // 2. Perform ML Inference (Anomaly Detection + Fault Classification + SHAP)
        Map<String, Object> inferResult = mlClient.infer(features);

        boolean isAnomaly = Boolean.TRUE.equals(inferResult.get("is_anomaly"));
        double anomalyScore = ((Number) inferResult.getOrDefault("anomaly_score", 0.0)).doubleValue();
        String predictedFault = (String) inferResult.getOrDefault("predicted_fault_class", "HEALTHY");
        double confidence = ((Number) inferResult.getOrDefault("confidence", 0.0)).doubleValue();
        Map<String, Double> classProbs = (Map<String, Double>) inferResult.getOrDefault("class_probabilities", Collections.emptyMap());

        // 3. Update rolling buffer and estimate RUL
        List<Map<String, Double>> buffer = rollingFeatureBuffers.computeIfAbsent(motorId, k -> new ArrayList<>());
        synchronized (buffer) {
            buffer.add(new HashMap<>(features));
            if (buffer.size() > 10) {
                buffer.remove(0);
            }
        }

        Double estimatedRulHours = null;
        if (buffer.size() >= 5) {
            Map<String, Object> rulResult = mlClient.predictRul(buffer);
            if (rulResult != null && rulResult.containsKey("estimated_rul_hours")) {
                estimatedRulHours = ((Number) rulResult.get("estimated_rul_hours")).doubleValue();
            }
        }

        // 4. Calculate Health Score with EWMA smoothing
        double probHealthy = classProbs.getOrDefault("HEALTHY", 1.0);
        double tempPenalty = Math.max(0.0, (request.getTemperatureC() - 65.0) * 0.8);
        double rawHealth = Math.max(0.0, Math.min(100.0, 100.0 - (anomalyScore * 35.0 + (1.0 - probHealthy) * 45.0 + tempPenalty)));

        MotorTwinState existingTwinState = twinStateRepository.findByMotorId(motorId).orElse(null);
        double healthScore;
        if (existingTwinState != null && existingTwinState.getHealthScore() > 0) {
            double prevHealth = existingTwinState.getHealthScore();
            // Alpha = 0.3 for monotonic, jitter-free EWMA smoothing
            healthScore = Math.max(0.0, Math.min(100.0, Math.round((0.3 * rawHealth + 0.7 * prevHealth) * 10.0) / 10.0));
        } else {
            healthScore = Math.round(rawHealth * 10.0) / 10.0;
        }

        // 5. Determine Operational State
        OperationalState operationalState;
        if (healthScore < 50.0 || (isAnomaly && !"HEALTHY".equalsIgnoreCase(predictedFault) && confidence > 0.8)) {
            operationalState = OperationalState.CRITICAL;
        } else if (healthScore < 80.0 || isAnomaly) {
            operationalState = OperationalState.WARNING;
        } else {
            operationalState = OperationalState.HEALTHY;
        }

        // 6. Persist Telemetry Measurement
        TelemetryMeasurement measurement = new TelemetryMeasurement();
        measurement.setMotorId(motorId);
        measurement.setRunId(request.getRunId());
        measurement.setTimestamp(Instant.now());
        measurement.setLoadPct(request.getLoadPct());
        measurement.setCurrentRms(features.getOrDefault("current_rms", 0.0));
        measurement.setFundamentalAmp(features.getOrDefault("current_fundamental_amp", 0.0));
        measurement.setDominantFreq(features.getOrDefault("current_dominant_freq", 50.0));
        measurement.setCurrentThd(features.getOrDefault("current_thd", 0.0));
        measurement.setBrbSidebandRatio(features.getOrDefault("brb_sideband_ratio", 0.0));
        measurement.setVibRms(features.getOrDefault("vib_rms", 0.0));
        measurement.setVibKurtosis(features.getOrDefault("vib_kurtosis", 0.0));
        measurement.setVibPeakToPeak(features.getOrDefault("vib_peak_to_peak", 0.0));
        measurement.setVibBpfoEnergy(features.getOrDefault("vib_bpfo_energy", 0.0));
        measurement.setVib1xShaftAmp(features.getOrDefault("vib_1x_shaft_amp", 0.0));
        measurement.setTemperatureC(request.getTemperatureC());
        measurement.setTempRateOfRise(features.getOrDefault("temp_rate_of_rise", 0.0));
        telemetryRepository.save(measurement);

        // 7. Persist Prediction Record
        PredictionRecord predRecord = new PredictionRecord();
        predRecord.setMotorId(motorId);
        predRecord.setTimestamp(Instant.now());
        predRecord.setAnomaly(isAnomaly);
        predRecord.setAnomalyScore(anomalyScore);
        predRecord.setPredictedFaultClass(predictedFault);
        predRecord.setConfidence(confidence);
        predRecord.setEstimatedRulHours(estimatedRulHours);
        try {
            predRecord.setProbabilitiesJson(objectMapper.writeValueAsString(classProbs));
        } catch (JsonProcessingException ignored) {}
        predRecord = predictionRepository.save(predRecord);

        // 8. Persist SHAP Explanation
        Map<String, Object> shapData = (Map<String, Object>) inferResult.get("shap_explanation");
        List<Map<String, Object>> topAttributions = Collections.emptyList();
        if (shapData != null && shapData.containsKey("top_attributions")) {
            topAttributions = (List<Map<String, Object>>) shapData.get("top_attributions");
            ShapExplanationRecord shapRecord = new ShapExplanationRecord();
            shapRecord.setPredictionId(predRecord.getId());
            shapRecord.setMotorId(motorId);
            shapRecord.setTimestamp(Instant.now());
            shapRecord.setPredictedClass(predictedFault);
            try {
                shapRecord.setTopAttributionsJson(objectMapper.writeValueAsString(topAttributions));
            } catch (JsonProcessingException ignored) {}
            shapRepository.save(shapRecord);
        }

        // 9. Alert Evaluation & Maintenance Advisory
        Map<String, Object> advisory = advisoryService.generateRecommendation(
                predictedFault,
                isAnomaly,
                anomalyScore,
                confidence,
                features.getOrDefault("current_rms", 0.0),
                features.getOrDefault("vib_rms", 0.0),
                features.getOrDefault("vib_kurtosis", 0.0),
                request.getTemperatureC()
        );

        if (operationalState != OperationalState.HEALTHY) {
            checkAndTriggerAlert(motorId, advisory, features);
        }

        int activeAlerts = alertRepository.countByMotorIdAndStatus(motorId, AlertStatus.ACTIVE);

        // 10. Update Digital Twin State
        MotorTwinState twinState = twinStateRepository.findByMotorId(motorId)
                .orElse(new MotorTwinState(motorId));
        twinState.setLastUpdated(Instant.now());
        twinState.setOperationalState(operationalState);
        twinState.setHealthScore(healthScore);
        twinState.setAnomaly(isAnomaly);
        twinState.setAnomalyScore(anomalyScore);
        twinState.setPredictedFaultClass(predictedFault);
        twinState.setConfidence(confidence);
        twinState.setEstimatedRulHours(estimatedRulHours);
        twinState.setLatestCurrentRms(features.getOrDefault("current_rms", 0.0));
        twinState.setLatestVibRms(features.getOrDefault("vib_rms", 0.0));
        twinState.setLatestVibKurtosis(features.getOrDefault("vib_kurtosis", 0.0));
        twinState.setLatestTemperatureC(request.getTemperatureC());
        twinState.setLatestLoadPct(request.getLoadPct());
        twinState.setLatestEstimatedSpeedRpm(features.getOrDefault("estimated_speed_rpm", 1440.0));
        twinState.setActiveAlertCount(activeAlerts);
        twinStateRepository.save(twinState);

        // Build Response
        DigitalTwinResponse response = DigitalTwinResponse.from(motor, twinState);
        response.setClassProbabilities(classProbs);
        response.setTopShapAttributions(topAttributions);
        response.setLatestMaintenanceRecommendation(advisory);
        return response;
    }

    private void checkAndTriggerAlert(String motorId, Map<String, Object> advisory, Map<String, Double> features) {
        AlertSeverity severity = (AlertSeverity) advisory.get("severity");
        String title = (String) advisory.get("title");
        String summary = (String) advisory.get("summary");
        List<String> actions = (List<String>) advisory.get("suggestedActions");

        // Suppress repeated alert if active alert for same title within 3 minutes
        List<AlertRecord> existingAlerts = alertRepository.findByStatusOrderByTimestampDesc(AlertStatus.ACTIVE);
        boolean duplicate = existingAlerts.stream().anyMatch(a ->
                a.getMotorId().equals(motorId) &&
                a.getTitle().equals(title) &&
                Duration.between(a.getTimestamp(), Instant.now()).toMinutes() < 3
        );

        if (!duplicate) {
            AlertRecord alert = new AlertRecord();
            alert.setMotorId(motorId);
            alert.setTimestamp(Instant.now());
            alert.setSeverity(severity);
            alert.setTitle(title);
            alert.setDescription(summary);
            alert.setSuggestedAction(String.join("; ", actions));
            try {
                alert.setEvidenceJson(objectMapper.writeValueAsString(features));
            } catch (JsonProcessingException ignored) {}
            alert.setStatus(AlertStatus.ACTIVE);
            alertRepository.save(alert);
            log.info("Triggered [{}] Alert for Motor {}: {}", severity, motorId, title);
        }
    }

    public DigitalTwinResponse getTwinState(String motorId) {
        Motor motor = motorRepository.findById(motorId).orElse(null);
        MotorTwinState state = twinStateRepository.findByMotorId(motorId)
                .orElseGet(() -> {
                    MotorTwinState def = new MotorTwinState(motorId);
                    return twinStateRepository.save(def);
                });
        DigitalTwinResponse res = DigitalTwinResponse.from(motor, state);

        // Fetch latest prediction probabilities and SHAP
        predictionRepository.findFirstByMotorIdOrderByTimestampDesc(motorId).ifPresent(p -> {
            if (p.getProbabilitiesJson() != null) {
                try {
                    Map<String, Double> probs = objectMapper.readValue(p.getProbabilitiesJson(), Map.class);
                    res.setClassProbabilities(probs);
                } catch (Exception ignored) {}
            }
        });

        shapRepository.findFirstByMotorIdOrderByTimestampDesc(motorId).ifPresent(s -> {
            if (s.getTopAttributionsJson() != null) {
                try {
                    List<Map<String, Object>> attrs = objectMapper.readValue(s.getTopAttributionsJson(), List.class);
                    res.setTopShapAttributions(attrs);
                } catch (Exception ignored) {}
            }
        });

        res.setLatestMaintenanceRecommendation(advisoryService.generateRecommendation(
                state.getPredictedFaultClass(),
                state.isAnomaly(),
                state.getAnomalyScore(),
                state.getConfidence(),
                state.getLatestCurrentRms(),
                state.getLatestVibRms(),
                state.getLatestVibKurtosis(),
                state.getLatestTemperatureC()
        ));

        return res;
    }

    public List<DigitalTwinResponse> getAllTwinStates() {
        List<Motor> motors = motorRepository.findAll();
        List<DigitalTwinResponse> list = new ArrayList<>();
        for (Motor m : motors) {
            list.add(getTwinState(m.getId()));
        }
        return list;
    }
}
