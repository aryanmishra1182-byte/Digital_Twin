"""
Motor Telemetry Simulator
=========================
Simulates three-phase induction motor signals:
- Stator current (Phase A, B, C) at 10 kHz
- Radial vibration acceleration (m/s^2) at 10 kHz
- Motor winding temperature (°C) on a slower thermal time scale

Based on IEEE Research Paper specifications:
- 3 kW, 415 V, 50 Hz, 4-pole squirrel-cage induction motor
- Nominal speed ~1440 RPM (nominal slip ~0.04 at full load)
- Operating loads: 25%, 50%, 75%, 100%
- Fault classes:
  0: HEALTHY
  1: BROKEN_ROTOR_BAR (sidebands at fs*(1 +/- 2ks))
  2: STATOR_INTER_TURN_SHORT (harmonics + localized heating)
  3: BEARING_DEFECT (impulsive BPFO/BPFI sidebands)
  4: AIR_GAP_ECCENTRICITY (fs +/- fr sidebands + 1x/2x vibration)
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Dict, Any, Tuple, Optional, List
import time

FAULT_CLASSES = [
    "HEALTHY",
    "BROKEN_ROTOR_BAR",
    "STATOR_INTER_TURN_SHORT",
    "BEARING_DEFECT",
    "AIR_GAP_ECCENTRICITY"
]

@dataclass
class MotorParams:
    motor_id: str = "MOTOR-001"
    rated_power_kw: float = 3.0
    supply_voltage_v: float = 415.0
    supply_freq_hz: float = 50.0
    poles: int = 4
    nominal_slip: float = 0.04
    rated_speed_rpm: float = 1440.0
    sampling_rate_hz: int = 10000
    window_duration_s: float = 1.0
    ambient_temp_c: float = 25.0
    # Bearing geometry (6205 standard ball bearing illustrative parameters)
    bearing_balls: int = 9
    bearing_pitch_dia_mm: float = 38.5
    bearing_ball_dia_mm: float = 7.94
    bearing_contact_angle_deg: float = 0.0

@dataclass
class TelemetryWindow:
    motor_id: str
    run_id: str
    timestamp: float
    load_pct: float
    fault_class: str
    severity: float  # 0.0 (none) to 1.0 (severe)
    sampling_rate_hz: int
    duration_s: float
    current_signal: np.ndarray  # (N,) float64 Phase A current (A)
    vibration_signal: np.ndarray  # (N,) float64 Radial vibration (m/s^2)
    temperature_c: float  # scalar temperature at end of window (°C)
    prev_temperature_c: float
    operating_speed_rpm: float
    slip: float
    provenance: str = "Synthetic Simulation"
    combined_faults: Optional[List[Tuple[str, float]]] = None

class MotorSimulator:
    def __init__(self, params: Optional[MotorParams] = None, seed: Optional[int] = 42):
        self.params = params or MotorParams()
        self.rng = np.random.RandomState(seed)
        self.current_temp = self.params.ambient_temp_c + 15.0  # initial warm state (~40°C)
        self.thermal_tau_s = 90.0  # thermal time constant in seconds
        # Persistent sensor DC drift state
        self.current_dc_drift = 0.0
        self.vib_dc_drift = 0.0

    def _calculate_operating_points(self, load_pct: float, speed_jitter_pct: float = 0.0) -> Tuple[float, float, float]:
        """
        Calculate actual slip, rotational speed, and shaft frequency under load.
        load_pct: 0.25, 0.50, 0.75, 1.00
        """
        fs = self.params.supply_freq_hz
        sync_speed_rpm = (120.0 * fs) / self.params.poles  # 1500 RPM for 4 poles at 50 Hz
        slip = self.params.nominal_slip * (load_pct / 100.0)
        base_speed_rpm = sync_speed_rpm * (1.0 - slip)
        # Apply slight speed wander/jitter
        speed_rpm = base_speed_rpm * (1.0 + (speed_jitter_pct / 100.0))
        shaft_freq_hz = speed_rpm / 60.0  # fr in Hz (~24 Hz)
        return slip, speed_rpm, shaft_freq_hz

    def _calculate_bearing_frequencies(self, fr: float) -> Tuple[float, float]:
        """
        Calculate BPFO and BPFI ball pass frequencies using Eq. (2).
        f_bpfo = (n/2)*fr*(1 - (d/D)*cos(alpha))
        f_bpfi = (n/2)*fr*(1 + (d/D)*cos(alpha))
        """
        n = self.params.bearing_balls
        d = self.params.bearing_ball_dia_mm
        D = self.params.bearing_pitch_dia_mm
        alpha = np.radians(self.params.bearing_contact_angle_deg)
        ratio = (d / D) * np.cos(alpha)
        f_bpfo = (n / 2.0) * fr * (1.0 - ratio)
        f_bpfi = (n / 2.0) * fr * (1.0 + ratio)
        return f_bpfo, f_bpfi

    def _inject_fault_effects(
        self,
        fault_name: str,
        sev: float,
        t: np.ndarray,
        fs: float,
        fr: float,
        slip: float,
        f_bpfo: float,
        i_peak: float,
        duration: float,
        current: np.ndarray,
        vibration: np.ndarray
    ) -> float:
        """
        Apply physical harmonic/spectral changes for a given fault and return additional thermal offset.
        """
        extra_temp = 0.0
        if fault_name == "BROKEN_ROTOR_BAR":
            f_br_left = fs * (1.0 - 2.0 * slip)
            f_br_right = fs * (1.0 + 2.0 * slip)
            sb_amp = i_peak * (0.04 + 0.12 * sev)
            current += sb_amp * np.sin(2.0 * np.pi * f_br_left * t + 0.5)
            current += sb_amp * np.sin(2.0 * np.pi * f_br_right * t - 0.5)
            f_br2_left = fs * (1.0 - 4.0 * slip)
            f_br2_right = fs * (1.0 + 4.0 * slip)
            current += (sb_amp * 0.35) * np.sin(2.0 * np.pi * f_br2_left * t)
            current += (sb_amp * 0.35) * np.sin(2.0 * np.pi * f_br2_right * t)
            vibration += (0.6 * sev) * np.sin(2.0 * np.pi * (2.0 * slip * fs) * t) * np.sin(2.0 * np.pi * fr * t)
            extra_temp += 10.0 * sev

        elif fault_name == "STATOR_INTER_TURN_SHORT":
            short_harmonic_amp = i_peak * (0.06 + 0.20 * sev)
            current += short_harmonic_amp * np.sin(2.0 * np.pi * (3.0 * fs) * t + 1.2)
            current += (short_harmonic_amp * 0.4) * np.sin(2.0 * np.pi * (5.0 * fs) * t)
            current *= (1.0 + 0.08 * sev)
            vibration += (0.8 * sev) * np.sin(2.0 * np.pi * (2.0 * fs) * t)
            extra_temp += 35.0 * sev

        elif fault_name == "BEARING_DEFECT":
            f_res = 2500.0
            decay_rate = 600.0
            t_period = 1.0 / max(f_bpfo, 10.0)
            impulse_times = np.arange(0, duration, t_period)
            for it in impulse_times:
                mask = (t >= it) & (t < it + 0.015)
                dt = t[mask] - it
                vibration[mask] += (1.5 + 4.5 * sev) * np.exp(-decay_rate * dt) * np.sin(2.0 * np.pi * f_res * dt)
            current += (0.02 * i_peak * sev) * np.sin(2.0 * np.pi * f_bpfo * t)
            extra_temp += 8.0 * sev

        elif fault_name == "AIR_GAP_ECCENTRICITY":
            f_ecc_left = fs - fr
            f_ecc_right = fs + fr
            ecc_amp = i_peak * (0.03 + 0.09 * sev)
            current += ecc_amp * np.sin(2.0 * np.pi * f_ecc_left * t)
            current += ecc_amp * np.sin(2.0 * np.pi * f_ecc_right * t)
            vibration += (1.2 * sev) * np.sin(2.0 * np.pi * fr * t + 0.8)
            vibration += (0.7 * sev) * np.sin(2.0 * np.pi * (2.0 * fr) * t + 1.4)
            extra_temp += 12.0 * sev

        return extra_temp

    def generate_window(
        self,
        run_id: str = "RUN-001",
        load_pct: float = 100.0,
        fault_class: str = "HEALTHY",
        severity: float = 0.0,
        t_start: float = 0.0,
        noise_level: float = 0.05,
        voltage_unbalance_pct: float = 0.0,
        speed_jitter_pct: float = 0.0,
        dc_drift: bool = False,
        combined_faults: Optional[List[Tuple[str, float]]] = None
    ) -> TelemetryWindow:
        """
        Generate a single 1-second telemetry window (10,000 samples @ 10 kHz).
        Includes physics-guided fault harmonics, supply unbalance, speed wander, and sensor drift.
        """
        if combined_faults is None and fault_class not in FAULT_CLASSES:
            raise ValueError(f"Unknown fault class: {fault_class}. Allowed: {FAULT_CLASSES}")

        fs = self.params.supply_freq_hz
        sr = self.params.sampling_rate_hz
        duration = self.params.window_duration_s
        n_samples = int(sr * duration)
        t = np.linspace(t_start, t_start + duration, n_samples, endpoint=False)

        slip, speed_rpm, fr = self._calculate_operating_points(load_pct, speed_jitter_pct)
        f_bpfo, f_bpfi = self._calculate_bearing_frequencies(fr)

        # Baseline Current: Rated RMS current ~ 6.0 A for 3 kW 415 V motor at full load
        base_i_rms = 5.8 * (0.3 + 0.7 * (load_pct / 100.0))
        i_peak = base_i_rms * np.sqrt(2.0)

        # Baseline fundamental Phase A current
        current = i_peak * np.sin(2.0 * np.pi * fs * t)
        # Normal small 3rd and 5th harmonics (1-2%)
        current += (0.015 * i_peak) * np.sin(2.0 * np.pi * (3.0 * fs) * t)
        current += (0.008 * i_peak) * np.sin(2.0 * np.pi * (5.0 * fs) * t)

        # 1-3% Supply Voltage Unbalance: creates negative-sequence 2*fs (100 Hz) current and pulsating torque
        if voltage_unbalance_pct > 0.0:
            unbal_fraction = voltage_unbalance_pct / 100.0
            current += (unbal_fraction * i_peak * 0.5) * np.sin(2.0 * np.pi * (2.0 * fs) * t + 0.7)

        # Baseline Vibration: low normal background vibration (~0.5 m/s^2 RMS)
        vibration = 0.4 * (load_pct / 100.0) * np.sin(2.0 * np.pi * fr * t)
        vibration += 0.2 * np.sin(2.0 * np.pi * (2.0 * fr) * t)
        if voltage_unbalance_pct > 0.0:
            vibration += (voltage_unbalance_pct / 100.0 * 0.4) * np.sin(2.0 * np.pi * (2.0 * fs) * t)

        # Sensor DC offset and slow random-walk drift
        if dc_drift:
            self.current_dc_drift += float(self.rng.normal(0, 0.002))
            self.vib_dc_drift += float(self.rng.normal(0, 0.001))
            current += self.current_dc_drift
            vibration += self.vib_dc_drift

        # Inherent sensor white noise (SNR 15-22 dB)
        current += self.rng.normal(0, noise_level * base_i_rms, n_samples)
        vibration += self.rng.normal(0, 0.15 + 0.12 * noise_level, n_samples)

        # Apply Faults
        fault_thermal_offset = 0.0
        if combined_faults is not None and len(combined_faults) > 0:
            for c_fault, c_sev in combined_faults:
                fault_thermal_offset += self._inject_fault_effects(
                    c_fault, c_sev, t, fs, fr, slip, f_bpfo, i_peak, duration, current, vibration
                )
        elif fault_class != "HEALTHY":
            fault_thermal_offset += self._inject_fault_effects(
                fault_class, severity, t, fs, fr, slip, f_bpfo, i_peak, duration, current, vibration
            )

        # Thermal Model:
        steady_state_temp = self.params.ambient_temp_c + (load_pct / 100.0)**2 * 40.0 + fault_thermal_offset

        # Update temperature with first-order exponential relaxation
        prev_temp = self.current_temp
        alpha_thermal = 1.0 - np.exp(-duration / self.thermal_tau_s)
        self.current_temp += alpha_thermal * (steady_state_temp - self.current_temp)
        measured_temp = float(self.current_temp + self.rng.normal(0, 0.03))

        primary_class = fault_class if combined_faults is None else "COMBINED_FAULT"

        return TelemetryWindow(
            motor_id=self.params.motor_id,
            run_id=run_id,
            timestamp=t_start,
            load_pct=float(load_pct),
            fault_class=primary_class,
            severity=float(severity),
            sampling_rate_hz=sr,
            duration_s=duration,
            current_signal=current,
            vibration_signal=vibration,
            temperature_c=measured_temp,
            prev_temperature_c=prev_temp,
            operating_speed_rpm=float(speed_rpm),
            slip=float(slip),
            combined_faults=combined_faults
        )

    def simulate_degradation_run(
        self,
        run_id: str,
        fault_class: str,
        total_hours: float = 100.0,
        step_minutes: float = 10.0,
        load_pct: float = 100.0,
        degradation_law: str = "power",
        gamma: float = 1.8
    ) -> List[TelemetryWindow]:
        """
        Simulate a progressive run-to-failure degradation trajectory for RUL evaluation.
        Supports multi-law degradation: linear, exponential, or power-law (gamma in [1.4, 2.6]).
        """
        windows = []
        n_steps = int((total_hours * 60.0) / step_minutes)
        for step in range(n_steps):
            elapsed_hours = (step * step_minutes) / 60.0
            wear_fraction = elapsed_hours / total_hours

            if degradation_law == "linear":
                raw_sev = wear_fraction
            elif degradation_law == "exponential":
                raw_sev = (np.exp(2.8 * wear_fraction) - 1.0) / (np.exp(2.8) - 1.0)
            else:  # power law
                raw_sev = wear_fraction ** gamma

            severity = float(np.clip(raw_sev, 0.0, 1.0))
            active_fault = "HEALTHY" if wear_fraction < 0.20 else fault_class
            active_severity = 0.0 if active_fault == "HEALTHY" else severity

            # Realism: slight speed jitter (+/- 0.8%) and 1% supply unbalance
            jitter = float(self.rng.uniform(-0.8, 0.8))
            window = self.generate_window(
                run_id=run_id,
                load_pct=load_pct,
                fault_class=active_fault,
                severity=active_severity,
                t_start=elapsed_hours * 3600.0,
                voltage_unbalance_pct=1.0,
                speed_jitter_pct=jitter,
                dc_drift=True
            )
            windows.append(window)
        return windows
