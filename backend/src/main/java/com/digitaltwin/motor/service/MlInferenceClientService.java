package com.digitaltwin.motor.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;

@Service
public class MlInferenceClientService {

    private static final Logger log = LoggerFactory.getLogger(MlInferenceClientService.class);

    private final RestTemplate restTemplate;
    private final String mlServiceUrl;

    public MlInferenceClientService(
            RestTemplateBuilder builder,
            @Value("${ml.service.url:http://localhost:8001}") String mlServiceUrl,
            @Value("${ml.service.timeout-ms:5000}") int timeoutMs
    ) {
        this.mlServiceUrl = mlServiceUrl;
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofMillis(timeoutMs))
                .setReadTimeout(Duration.ofMillis(timeoutMs))
                .build();
    }

    public Map<String, Object> checkHealth() {
        try {
            ResponseEntity<Map> res = restTemplate.getForEntity(mlServiceUrl + "/health", Map.class);
            return res.getBody();
        } catch (Exception e) {
            log.warn("ML Service unavailable at {}: {}", mlServiceUrl, e.getMessage());
            return Map.of(
                    "status", "DOWN",
                    "error", "Cannot reach ML service at " + mlServiceUrl + ". Ensure Python ML service is running.",
                    "available", false
            );
        }
    }

    public Map<String, Double> extractFeatures(Map<String, Object> rawSignalsPayload) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(rawSignalsPayload, headers);
        try {
            ResponseEntity<Map> res = restTemplate.postForEntity(mlServiceUrl + "/extract-features", entity, Map.class);
            if (res.getBody() != null && res.getBody().containsKey("features")) {
                Map<String, Object> rawFeats = (Map<String, Object>) res.getBody().get("features");
                Map<String, Double> feats = new HashMap<>();
                rawFeats.forEach((k, v) -> feats.put(k, ((Number) v).doubleValue()));
                return feats;
            }
        } catch (Exception e) {
            log.error("Failed to extract features via ML service: {}", e.getMessage());
            throw new RuntimeException("Feature extraction failed: " + e.getMessage(), e);
        }
        return Collections.emptyMap();
    }

    public Map<String, Object> infer(Map<String, Double> features) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> req = Map.of("features", features);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(req, headers);

        try {
            ResponseEntity<Map> res = restTemplate.postForEntity(mlServiceUrl + "/infer", entity, Map.class);
            return res.getBody();
        } catch (ResourceAccessException e) {
            log.error("ML service unreachable during inference: {}", e.getMessage());
            throw new RuntimeException("ML Inference service unavailable. Start the Python service with `python ml/service.py`", e);
        } catch (Exception e) {
            log.error("Inference call failed: {}", e.getMessage());
            throw new RuntimeException("Inference execution failed: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> predictRul(List<Map<String, Double>> featureSequence) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> req = Map.of("sequence", featureSequence);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(req, headers);

        try {
            ResponseEntity<Map> res = restTemplate.postForEntity(mlServiceUrl + "/predict-rul", entity, Map.class);
            return res.getBody();
        } catch (Exception e) {
            log.warn("RUL prediction failed (requires sequence history): {}", e.getMessage());
            return null;
        }
    }

    public Map<String, Object> getGlobalImportance() {
        try {
            ResponseEntity<Map> res = restTemplate.getForEntity(mlServiceUrl + "/global-importance", Map.class);
            return res.getBody();
        } catch (Exception e) {
            log.warn("Global importance unavailable: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}
