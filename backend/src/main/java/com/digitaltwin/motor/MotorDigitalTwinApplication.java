package com.digitaltwin.motor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MotorDigitalTwinApplication {
    public static void main(String[] args) {
        SpringApplication.run(MotorDigitalTwinApplication.class, args);
    }
}
