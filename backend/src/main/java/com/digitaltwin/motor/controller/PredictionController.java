package com.digitaltwin.motor.controller;

import com.digitaltwin.motor.domain.PredictionRecord;
import com.digitaltwin.motor.domain.ShapExplanationRecord;
import com.digitaltwin.motor.repository.PredictionRecordRepository;
import com.digitaltwin.motor.repository.ShapExplanationRecordRepository;
import com.digitaltwin.motor.service.MlInferenceClientService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/predictions")
@CrossOrigin(origins = "*")
public class PredictionController {

    private final PredictionRecordRepository predictionRepository;
    private final ShapExplanationRecordRepository shapRepository;
    private final MlInferenceClientService mlClient;

    public PredictionController(
            PredictionRecordRepository predictionRepository,
            ShapExplanationRecordRepository shapRepository,
            MlInferenceClientService mlClient
    ) {
        this.predictionRepository = predictionRepository;
        this.shapRepository = shapRepository;
        this.mlClient = mlClient;
    }

    @GetMapping("/history/{motorId}")
    public ResponseEntity<List<PredictionRecord>> getPredictionHistory(
            @PathVariable String motorId,
            @RequestParam(defaultValue = "30") int limit
    ) {
        int boundedLimit = Math.max(1, Math.min(200, limit));
        return ResponseEntity.ok(predictionRepository.findByMotorIdOrderByTimestampDesc(motorId, PageRequest.of(0, boundedLimit)));
    }

    @GetMapping("/latest/{motorId}")
    public ResponseEntity<PredictionRecord> getLatestPrediction(@PathVariable String motorId) {
        return predictionRepository.findFirstByMotorIdOrderByTimestampDesc(motorId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/shap/latest/{motorId}")
    public ResponseEntity<ShapExplanationRecord> getLatestShap(@PathVariable String motorId) {
        return shapRepository.findFirstByMotorIdOrderByTimestampDesc(motorId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/global-importance")
    public ResponseEntity<Map<String, Object>> getGlobalImportance() {
        return ResponseEntity.ok(mlClient.getGlobalImportance());
    }
}
