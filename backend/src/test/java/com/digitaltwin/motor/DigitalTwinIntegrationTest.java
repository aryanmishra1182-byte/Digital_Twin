package com.digitaltwin.motor;

import com.digitaltwin.motor.domain.AlertRecord;
import com.digitaltwin.motor.domain.AlertStatus;
import com.digitaltwin.motor.domain.Motor;
import com.digitaltwin.motor.dto.AlertActionRequest;
import com.digitaltwin.motor.dto.MotorRegistrationRequest;
import com.digitaltwin.motor.dto.TelemetryIngestRequest;
import com.digitaltwin.motor.repository.AlertRecordRepository;
import com.digitaltwin.motor.repository.MotorRepository;
import com.digitaltwin.motor.service.MlInferenceClientService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class DigitalTwinIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MotorRepository motorRepository;

    @Autowired
    private AlertRecordRepository alertRepository;

    @MockBean
    private MlInferenceClientService mlClient;

    @BeforeEach
    void setupMocks() {
        // Setup ML mock responses
        Map<String, Object> mockHealth = Map.of(
                "status", "UP",
                "anomaly_detector_loaded", true,
                "fault_classifier_loaded", true,
                "rul_model_loaded", true,
                "shap_explainer_loaded", true
        );
        Mockito.when(mlClient.checkHealth()).thenReturn(mockHealth);

        Map<String, Object> mockInfer = new HashMap<>();
        mockInfer.put("is_anomaly", true);
        mockInfer.put("anomaly_score", 0.72);
        mockInfer.put("predicted_fault_class", "BROKEN_ROTOR_BAR");
        mockInfer.put("confidence", 0.88);
        mockInfer.put("class_probabilities", Map.of(
                "HEALTHY", 0.05,
                "BROKEN_ROTOR_BAR", 0.88,
                "STATOR_INTER_TURN_SHORT", 0.03,
                "BEARING_DEFECT", 0.02,
                "AIR_GAP_ECCENTRICITY", 0.02
        ));
        mockInfer.put("shap_explanation", Map.of(
                "top_attributions", List.of(
                        Map.of("feature_name", "brb_sideband_ratio", "shap_value", 0.45, "impact", 0.45)
                )
        ));
        Mockito.when(mlClient.infer(any())).thenReturn(mockInfer);

        Map<String, Object> mockRul = Map.of("estimated_rul_hours", 38.5, "unit", "hours");
        Mockito.when(mlClient.predictRul(any())).thenReturn(mockRul);
    }

    @Test
    void testMotorsListingAndRetrieval() throws Exception {
        mockMvc.perform(get("/api/v1/motors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$[0].id").value("MOTOR-001"));

        mockMvc.perform(get("/api/v1/motors/MOTOR-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("MOTOR-001"))
                .andExpect(jsonPath("$.ratedPowerKw").value(3.0));
    }

    @Test
    void testRegisterNewMotor() throws Exception {
        MotorRegistrationRequest req = new MotorRegistrationRequest();
        req.setId("MOTOR-TEST-99");
        req.setName("Test Bench Motor");
        req.setRatedPowerKw(3.0);
        req.setSupplyVoltageV(415.0);

        mockMvc.perform(post("/api/v1/motors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("MOTOR-TEST-99"));
    }

    @Test
    void testTelemetryIngestionAndDigitalTwinSynchronization() throws Exception {
        TelemetryIngestRequest req = new TelemetryIngestRequest();
        req.setMotorId("MOTOR-001");
        req.setRunId("TEST-RUN-1");
        req.setLoadPct(100.0);
        req.setTemperatureC(58.0);
        req.setFeatures(Map.of(
                "current_rms", 6.1,
                "vib_rms", 0.9,
                "vib_kurtosis", 0.4,
                "brb_sideband_ratio", 0.12
        ));

        mockMvc.perform(post("/api/v1/telemetry/ingest")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.motorId").value("MOTOR-001"))
                .andExpect(jsonPath("$.isAnomaly").value(true))
                .andExpect(jsonPath("$.predictedFaultClass").value("BROKEN_ROTOR_BAR"))
                .andExpect(jsonPath("$.healthScore", lessThan(80.0)))
                .andExpect(jsonPath("$.operationalState").value("CRITICAL"));

        // Check Digital Twin query
        mockMvc.perform(get("/api/v1/twin/MOTOR-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.motorId").value("MOTOR-001"))
                .andExpect(jsonPath("$.predictedFaultClass").value("BROKEN_ROTOR_BAR"));
    }

    @Test
    void testAlertLifecycle() throws Exception {
        // Trigger an alert manually in DB
        AlertRecord alert = new AlertRecord();
        alert.setMotorId("MOTOR-001");
        alert.setTitle("Bearing Vibration Warning");
        alert.setDescription("High kurtosis detected.");
        alert.setStatus(AlertStatus.ACTIVE);
        alert = alertRepository.save(alert);

        // Acknowledge alert
        AlertActionRequest ackReq = new AlertActionRequest("Maintenance team dispatched.");
        mockMvc.perform(put("/api/v1/alerts/" + alert.getId() + "/acknowledge")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ackReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACKNOWLEDGED"));

        // Resolve alert
        AlertActionRequest resReq = new AlertActionRequest("Bearing lubricated and verified.");
        mockMvc.perform(put("/api/v1/alerts/" + alert.getId() + "/resolve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"));
    }

    @Test
    void testSimulatorStartAndStop() throws Exception {
        mockMvc.perform(post("/api/v1/simulator/start?motorId=MOTOR-001&scenario=BEARING_DEFECT&severity=0.5&loadPct=100.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRunning").value(true))
                .andExpect(jsonPath("$.scenario").value("BEARING_DEFECT"));

        mockMvc.perform(get("/api/v1/simulator/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRunning").value(true));

        mockMvc.perform(post("/api/v1/simulator/stop"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRunning").value(false));
    }
}
