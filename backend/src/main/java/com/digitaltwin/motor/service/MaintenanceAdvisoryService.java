package com.digitaltwin.motor.service;

import com.digitaltwin.motor.domain.AlertSeverity;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MaintenanceAdvisoryService {

    public Map<String, Object> generateRecommendation(
            String faultClass,
            boolean isAnomaly,
            double anomalyScore,
            double confidence,
            double currentRms,
            double vibRms,
            double vibKurtosis,
            double tempC
    ) {
        Map<String, Object> rec = new LinkedHashMap<>();
        rec.put("faultClass", faultClass);
        rec.put("isAnomaly", isAnomaly);
        rec.put("confidence", confidence);

        AlertSeverity severity;
        if (!isAnomaly && "HEALTHY".equalsIgnoreCase(faultClass)) {
            severity = AlertSeverity.P3_INFO;
            rec.put("severity", severity);
            rec.put("title", "Normal Motor Operation");
            rec.put("summary", "Motor operates within nominal electrical, mechanical, and thermal baselines.");
            rec.put("suggestedActions", List.of(
                    "Maintain standard routine lubrication schedule.",
                    "Continue continuous automated digital twin monitoring."
            ));
            rec.put("governingStandard", "ISO 10816-3 Zone A (Newly commissioned / Good condition)");
            rec.put("safetyDisclaimer", "Advisory recommendation only. Observe plant electrical safety procedures.");
            return rec;
        }

        // Determine priority based on fault severity & metrics
        if (confidence > 0.85 || anomalyScore > 0.85 || tempC > 85.0 || vibRms > 2.8) {
            severity = AlertSeverity.P1_CRITICAL;
        } else {
            severity = AlertSeverity.P2_WARNING;
        }
        rec.put("severity", severity);

        List<String> actions = new ArrayList<>();
        String title;
        String summary;
        String standard;

        switch (faultClass.toUpperCase()) {
            case "BROKEN_ROTOR_BAR" -> {
                title = "Potential Broken Rotor Bar Detected (MCSA Sidebands)";
                summary = String.format("Current spectrum reveals characteristic sidebands at fs*(1 +/- 2s). Anomaly score: %.2f, Confidence: %.1f%%.",
                        anomalyScore, confidence * 100.0);
                actions.add("Perform detailed high-resolution MCSA spectrum inspection at 46 Hz and 54 Hz sidebands.");
                actions.add("Schedule off-line single-phase rotor rotation test to verify bar resistance variance.");
                actions.add("Visually inspect cage end-rings and bar brazing joints with borescope during next planned downtime.");
                standard = "IEEE 112 / EPRI Motor Condition Assessment Guidelines";
            }
            case "STATOR_INTER_TURN_SHORT" -> {
                title = "Stator Turn-to-Turn Insulation Degradation Warning";
                summary = String.format("Elevated 3rd harmonic current distortion and thermal rise detected (Temp: %.1f°C).", tempC);
                actions.add("Measure phase-to-phase and turn-to-turn insulation resistance (Megger test).");
                actions.add("Perform off-line surge comparison testing to locate shorted stator turns.");
                actions.add("Check thermal imaging profile of stator casing for localized hotspot heating.");
                standard = "IEEE 522 Guide for Testing Turn Insulation of Form-Wound Stator Coils";
            }
            case "BEARING_DEFECT" -> {
                title = "Bearing Outer/Inner Race Defect Indication";
                summary = String.format("Impulsive vibration signature with elevated kurtosis (Kurtosis: %.2f, RMS: %.2f m/s²).",
                        vibKurtosis, vibRms);
                actions.add("Perform vibration high-frequency demodulation / envelope analysis targeting BPFO (~80 Hz) and BPFI (~135 Hz).");
                actions.add("Inspect lubricant for metal particulate contamination and replenish grease per manufacturer specs.");
                actions.add("Check bearing temperature and prepare replacement bearing assembly if vibration trend escalates.");
                standard = "ISO 15243 Rolling Bearings - Damage and Failures";
            }
            case "AIR_GAP_ECCENTRICITY" -> {
                title = "Air-Gap Eccentricity / Rotor Unbalance Warning";
                summary = String.format("Elevated 1x shaft rotational vibration and fs +/- fr current sidebands (Vib RMS: %.2f m/s²).", vibRms);
                actions.add("Measure static and dynamic air-gap clearance using feeler gauges at 4 orthogonal points.");
                actions.add("Verify motor and driven load shaft alignment with laser alignment tool.");
                actions.add("Inspect mounting bolts and foundation for soft-foot condition.");
                standard = "ISO 10816-3 Industrial Machines Vibration Severity Standard";
            }
            default -> {
                title = "Unrecognized Operational Anomaly Detected";
                summary = String.format("Isolation Forest flagged significant departure from healthy baseline (Anomaly score: %.2f), but classifier confidence is low.", anomalyScore);
                actions.add("Perform full multi-sensor audit (phase current balance, radial vibration, temperature rise).");
                actions.add("Verify power quality (voltage unbalance, harmonic distortion).");
                standard = "ISO 13373-1 Condition Monitoring and Diagnostics of Machines";
            }
        }

        rec.put("title", title);
        rec.put("summary", summary);
        rec.put("suggestedActions", actions);
        rec.put("governingStandard", standard);
        rec.put("safetyDisclaimer", "Advisory recommendation only. The digital twin does NOT automatically trip or control physical machinery.");
        return rec;
    }
}
