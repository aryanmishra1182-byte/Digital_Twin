package com.digitaltwin.motor.config;

import com.digitaltwin.motor.dto.TelemetryIngestRequest;
import com.digitaltwin.motor.service.DigitalTwinService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class MqttTelemetrySubscriber implements MqttCallback {

    private static final Logger log = LoggerFactory.getLogger(MqttTelemetrySubscriber.class);

    private final DigitalTwinService digitalTwinService;
    private final ObjectMapper objectMapper;

    @Value("${mqtt.enabled:false}")
    private boolean mqttEnabled;

    @Value("${mqtt.broker-url:tcp://localhost:1883}")
    private String brokerUrl;

    @Value("${mqtt.client-id:motor-twin-backend}")
    private String clientId;

    @Value("${mqtt.topics.telemetry:motors/+/telemetry}")
    private String telemetryTopic;

    private MqttClient client;

    public MqttTelemetrySubscriber(DigitalTwinService digitalTwinService, ObjectMapper objectMapper) {
        this.digitalTwinService = digitalTwinService;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        if (!mqttEnabled) {
            log.info("MQTT Telemetry Subscriber is disabled by configuration (mqtt.enabled=false). Application operates smoothly via REST & live simulator.");
            return;
        }

        try {
            client = new MqttClient(brokerUrl, clientId, new MemoryPersistence());
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setAutomaticReconnect(true);
            options.setConnectionTimeout(5);
            client.setCallback(this);
            client.connect(options);
            client.subscribe(telemetryTopic, 1);
            log.info("Connected to MQTT broker at {} and subscribed to {}", brokerUrl, telemetryTopic);
        } catch (MqttException e) {
            log.warn("Could not connect to MQTT broker at {} ({}). Telemetry ingestion via REST is fully functional.", brokerUrl, e.getMessage());
        }
    }

    @PreDestroy
    public void cleanup() {
        if (client != null && client.isConnected()) {
            try {
                client.disconnect();
                client.close();
            } catch (MqttException ignored) {}
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        log.warn("MQTT connection lost: {}", cause != null ? cause.getMessage() : "unknown");
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        try {
            String payload = new String(message.getPayload());
            TelemetryIngestRequest request = objectMapper.readValue(payload, TelemetryIngestRequest.class);
            digitalTwinService.processTelemetry(request);
        } catch (Exception e) {
            log.error("Error processing MQTT message on topic {}: {}", topic, e.getMessage());
        }
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {}
}
