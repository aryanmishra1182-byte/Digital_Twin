package com.digitaltwin.motor.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI motorDigitalTwinOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Explainable Digital Twin Framework API")
                        .description("Predictive Maintenance for Three-Phase Induction Motors featuring Physics-Guided Signal Processing, Isolation Forest Anomaly Detection, XGBoost Classification, LSTM RUL, and SHAP Explainability.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Research Team (Aditya Gupta, Aditya Maurya, Ananya Sharma, Aryan Mishra)")
                                .email("research@digitaltwin.internal")));
    }
}
