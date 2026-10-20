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

class MotorSimulator:
    def __init__(self, params: Optional[MotorParams] = None, seed: Optional[int] = 42):
        self.params = params or MotorParams()
        self.rng = np.random.RandomState(seed)
        self.current_temp = self.params.ambient_temp_c + 15.0  # initial warm state (~40°C)
        self.thermal_tau_s = 90.0  # thermal time constant in seconds

    def _calculate_operating_points(self, load_pct: float) -> Tuple[float, float, float]:
        """
        Calculate actual slip, rotational speed, and shaft frequency under load.
        load_pct: 0.25, 0.50, 0.75, 1.00
        """
        fs = self.params.supply_freq_hz
        sync_speed_rpm = (120.0 * fs) / self.params.poles  # 1500 RPM for 4 poles at 50 Hz
        slip = self.params.nominal_slip * (load_pct / 100.0)
        speed_rpm = sync_speed_rpm * (1.0 - slip)
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

    def generate_window(
        self,
        run_id: str = "RUN-001",
        load_pct: float = 100.0,
        fault_class: str = "HEALTHY",
        severity: float = 0.0,
        t_start: float = 0.0,
        noise_level: float = 0.05
    ) -> TelemetryWindow:
        """
        Generate a single 1-second telemetry window (10,000 samples @ 10 kHz).
        """
        if fault_class not in FAULT_CLASSES:
            raise ValueError(f"Unknown fault class: {fault_class}. Allowed: {FAULT_CLASSES}")

        fs = self.params.supply_freq_hz
        sr = self.params.sampling_rate_hz
        duration = self.params.window_duration_s
        n_samples = int(sr * duration)
        t = np.linspace(t_start, t_start + duration, n_samples, endpoint=False)

        slip, speed_rpm, fr = self._calculate_operating_points(load_pct)
        f_bpfo, f_bpfi = self._calculate_bearing_frequencies(fr)

        # Baseline Current: Rated RMS current ~ 6.0 A for 3 kW 415 V motor at full load
        # Fundamental amplitude I_peak = I_rms * sqrt(2) * (0.3 + 0.7 * (load_pct / 100))
        base_i_rms = 5.8 * (0.3 + 0.7 * (load_pct / 100.0))
        i_peak = base_i_rms * np.sqrt(2.0)

        # Baseline fundamental Phase A current
        current = i_peak * np.sin(2.0 * np.pi * fs * t)
        # Normal small 3rd and 5th harmonics (1-2%)
        current += (0.015 * i_peak) * np.sin(2.0 * np.pi * (3.0 * fs) * t)
        current += (0.008 * i_peak) * np.sin(2.0 * np.pi * (5.0 * fs) * t)

        # Baseline Vibration: low normal background vibration (~0.5 m/s^2 RMS)
        # Small unbalance at shaft frequency fr + normal bearing hum
        vibration = 0.4 * (load_pct / 100.0) * np.sin(2.0 * np.pi * fr * t)
        vibration += 0.2 * np.sin(2.0 * np.pi * (2.0 * fr) * t)

        # Inherent sensor white noise
        current += self.rng.normal(0, noise_level * base_i_rms, n_samples)
        vibration += self.rng.normal(0, 0.15 + 0.1 * noise_level, n_samples)

        # Fault Injections according to physics models
        if fault_class == "BROKEN_ROTOR_BAR":
            # Broken rotor bar sidebands from Eq. (1): f_br = fs * (1 +/- 2*k*s)
            # First order sidebands (k=1): ~46 Hz and ~54 Hz for s=0.04
            f_br_left = fs * (1.0 - 2.0 * slip)
            f_br_right = fs * (1.0 + 2.0 * slip)
            # Amplitude scales with severity (e.g. 1 or 2 broken bars -> -35 dB to -20 dB)
            sb_amp = i_peak * (0.04 + 0.12 * severity)
            current += sb_amp * np.sin(2.0 * np.pi * f_br_left * t + 0.5)
            current += sb_amp * np.sin(2.0 * np.pi * f_br_right * t - 0.5)
            # Second order sidebands (k=2)
            f_br2_left = fs * (1.0 - 4.0 * slip)
            f_br2_right = fs * (1.0 + 4.0 * slip)
            current += (sb_amp * 0.35) * np.sin(2.0 * np.pi * f_br2_left * t)
            current += (sb_amp * 0.35) * np.sin(2.0 * np.pi * f_br2_right * t)
            # Subtle torque modulation in vibration at 2*s*fs (~4 Hz)
            vibration += (0.6 * severity) * np.sin(2.0 * np.pi * (2.0 * slip * fs) * t) * np.sin(2.0 * np.pi * fr * t)

        elif fault_class == "STATOR_INTER_TURN_SHORT":
            # Inter-turn short circuit causes high localized current distortion,
            # prominent 3rd harmonic (150 Hz) and negative sequence asymmetry
            short_harmonic_amp = i_peak * (0.06 + 0.20 * severity)
            current += short_harmonic_amp * np.sin(2.0 * np.pi * (3.0 * fs) * t + 1.2)
            current += (short_harmonic_amp * 0.4) * np.sin(2.0 * np.pi * (5.0 * fs) * t)
            # Increased overall current drawn due to partial turn short
            current *= (1.0 + 0.08 * severity)
            # High frequency acoustic/vibrational hum at 2*fs (100 Hz electromagnetic ripple)
            vibration += (0.8 * severity) * np.sin(2.0 * np.pi * (2.0 * fs) * t)

        elif fault_class == "BEARING_DEFECT":
            # Outer/inner race defects produce repetitive impulses at BPFO (~80 Hz) and BPFI (~135 Hz)
            # Each impact excites high-frequency resonant decay (~2.5 kHz)
            f_res = 2500.0  # bearing resonance frequency
            decay_rate = 600.0
            t_period = 1.0 / f_bpfo
            # Generate impulsive impacts
            impulse_times = np.arange(0, duration, t_period)
            for it in impulse_times:
                mask = (t >= it) & (t < it + 0.015)
                dt = t[mask] - it
                vibration[mask] += (1.5 + 4.5 * severity) * np.exp(-decay_rate * dt) * np.sin(2.0 * np.pi * f_res * dt)
            # Also modulates stator current slightly (torque disturbance)
            current += (0.02 * i_peak * severity) * np.sin(2.0 * np.pi * f_bpfo * t)

        elif fault_class == "AIR_GAP_ECCENTRICITY":
            # Dynamic and static air-gap eccentricity creates current sidebands at fs +/- fr
            f_ecc_left = fs - fr   # ~26 Hz
            f_ecc_right = fs + fr  # ~74 Hz
            ecc_amp = i_peak * (0.03 + 0.09 * severity)
            current += ecc_amp * np.sin(2.0 * np.pi * f_ecc_left * t)
            current += ecc_amp * np.sin(2.0 * np.pi * f_ecc_right * t)
            # Strong vibration at 1x shaft frequency fr and 2x shaft frequency
            vibration += (1.2 * severity) * np.sin(2.0 * np.pi * fr * t + 0.8)
            vibration += (0.7 * severity) * np.sin(2.0 * np.pi * (2.0 * fr) * t + 1.4)

        # Thermal Model:
        # Steady state temperature: ambient + (I_rms / I_rated)^2 * 45°C + FaultHeat
        steady_state_temp = self.params.ambient_temp_c + (load_pct / 100.0)**2 * 40.0
        if fault_class == "STATOR_INTER_TURN_SHORT":
            steady_state_temp += 35.0 * severity  # severe heating from ohmic loop
        elif fault_class != "HEALTHY":
            steady_state_temp += 12.0 * severity  # moderate additional mechanical/electrical losses

        # Update temperature with first-order exponential relaxation
        prev_temp = self.current_temp
        alpha_thermal = 1.0 - np.exp(-duration / self.thermal_tau_s)
        self.current_temp += alpha_thermal * (steady_state_temp - self.current_temp)
        # Add slight measurement jitter (+/- 0.05 °C)
        measured_temp = float(self.current_temp + self.rng.normal(0, 0.03))

        return TelemetryWindow(
            motor_id=self.params.motor_id,
            run_id=run_id,
            timestamp=t_start,
            load_pct=float(load_pct),
            fault_class=fault_class,
            severity=float(severity),
            sampling_rate_hz=sr,
            duration_s=duration,
            current_signal=current,
            vibration_signal=vibration,
            temperature_c=measured_temp,
            prev_temperature_c=prev_temp,
            operating_speed_rpm=float(speed_rpm),
            slip=float(slip)
        )

    def simulate_degradation_run(
        self,
        run_id: str,
        fault_class: str,
        total_hours: float = 100.0,
        step_minutes: float = 10.0,
        load_pct: float = 100.0
    ) -> List[TelemetryWindow]:
        """
        Simulate a progressive run-to-failure degradation trajectory for RUL evaluation.
        RUL at step t is (total_hours - elapsed_hours).
        Severity grows non-linearly (exponential or polynomial wear curve).
        """
        windows = []
        n_steps = int((total_hours * 60.0) / step_minutes)
        for step in range(n_steps):
            elapsed_hours = (step * step_minutes) / 60.0
            # Progressive degradation model: severity starts low then accelerates
            wear_fraction = elapsed_hours / total_hours
            severity = float(np.clip(wear_fraction ** 1.8, 0.0, 1.0))
            active_fault = "HEALTHY" if wear_fraction < 0.25 else fault_class
            active_severity = 0.0 if active_fault == "HEALTHY" else severity

            window = self.generate_window(
                run_id=run_id,
                load_pct=load_pct,
                fault_class=active_fault,
                severity=active_severity,
                t_start=elapsed_hours * 3600.0
            )
            windows.append(window)
        return windows
