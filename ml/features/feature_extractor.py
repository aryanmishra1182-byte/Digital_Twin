"""
Physics-Guided Feature Extraction Module
=========================================
Extracts domain-informed features from:
1. Stator Current (Motor Current Signature Analysis - MCSA)
2. Vibration (Time-domain statistics + Ball Pass Frequency bands)
3. Temperature (Thermal trends and rate of rise)

Returns a deterministic, stable feature vector and documented schema.
"""

import numpy as np
from scipy import stats
from typing import Dict, Any, List, Tuple, Optional

FEATURE_NAMES = [
    # Current MCSA Features
    "current_rms",
    "current_fundamental_amp",
    "current_dominant_freq",
    "current_thd",
    "current_harm_3_ratio",
    "current_harm_5_ratio",
    "brb_left_sideband_amp",
    "brb_right_sideband_amp",
    "brb_sideband_ratio",
    "eccentricity_sideband_amp",
    # Vibration Features
    "vib_rms",
    "vib_std",
    "vib_peak",
    "vib_peak_to_peak",
    "vib_crest_factor",
    "vib_kurtosis",
    "vib_skewness",
    "vib_bpfo_energy",
    "vib_bpfi_energy",
    "vib_1x_shaft_amp",
    # Temperature Features
    "temp_mean",
    "temp_max",
    "temp_rate_of_rise",
    # Operating Condition Metadata
    "load_pct",
    "estimated_speed_rpm",
    "estimated_slip"
]

class FeatureExtractor:
    def __init__(
        self,
        supply_freq_hz: float = 50.0,
        nominal_slip: float = 0.04,
        poles: int = 4,
        sampling_rate_hz: int = 10000,
        bearing_balls: int = 9,
        bearing_pitch_dia_mm: float = 38.5,
        bearing_ball_dia_mm: float = 7.94,
        bearing_contact_angle_deg: float = 0.0
    ):
        self.supply_freq_hz = supply_freq_hz
        self.nominal_slip = nominal_slip
        self.poles = poles
        self.sampling_rate_hz = sampling_rate_hz
        self.bearing_balls = bearing_balls
        self.bearing_pitch_dia_mm = bearing_pitch_dia_mm
        self.bearing_ball_dia_mm = bearing_ball_dia_mm
        self.bearing_contact_angle_deg = bearing_contact_angle_deg

    def _fft_spectrum(self, signal: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Compute single-sided amplitude spectrum."""
        n = len(signal)
        # Apply Hanning window to reduce spectral leakage
        windowed = signal * np.hanning(n)
        fft_vals = np.fft.rfft(windowed)
        freqs = np.fft.rfftfreq(n, d=1.0 / self.sampling_rate_hz)
        # Scale for amplitude spectrum (compensate Hanning gain of 0.5)
        amps = (2.0 / n) * np.abs(fft_vals) * 2.0
        return freqs, amps

    def _extract_band_amplitude(
        self,
        freqs: np.ndarray,
        amps: np.ndarray,
        center_freq: float,
        half_bandwidth: float = 1.5
    ) -> float:
        """Find peak amplitude in a given frequency window."""
        mask = (freqs >= (center_freq - half_bandwidth)) & (freqs <= (center_freq + half_bandwidth))
        if not np.any(mask):
            return 0.0
        return float(np.max(amps[mask]))

    def _extract_band_energy(
        self,
        freqs: np.ndarray,
        amps: np.ndarray,
        center_freq: float,
        half_bandwidth: float = 3.0
    ) -> float:
        """Compute integrated energy (sum of squared amplitudes) in a band."""
        mask = (freqs >= (center_freq - half_bandwidth)) & (freqs <= (center_freq + half_bandwidth))
        if not np.any(mask):
            return 0.0
        return float(np.sum(amps[mask] ** 2))

    def extract_features(
        self,
        current_signal: np.ndarray,
        vibration_signal: np.ndarray,
        temperature_c: float,
        prev_temperature_c: Optional[float] = None,
        load_pct: float = 100.0,
        window_duration_s: float = 1.0
    ) -> Dict[str, float]:
        """
        Extract full physics-guided feature dictionary from one window.
        """
        # Validate inputs
        if len(current_signal) < 100 or len(vibration_signal) < 100:
            raise ValueError("Signal window too short for feature extraction")
        if not np.all(np.isfinite(current_signal)) or not np.all(np.isfinite(vibration_signal)):
            raise ValueError("Input signals contain non-finite (NaN or Inf) values")

        fs = self.supply_freq_hz
        sync_speed_rpm = (120.0 * fs) / self.poles  # 1500 RPM
        slip = self.nominal_slip * (load_pct / 100.0)
        speed_rpm = sync_speed_rpm * (1.0 - slip)
        fr = speed_rpm / 60.0  # shaft frequency (~24 Hz)

        # Bearing defect characteristic frequencies (Eq. 2)
        ratio = (self.bearing_ball_dia_mm / self.bearing_pitch_dia_mm) * np.cos(np.radians(self.bearing_contact_angle_deg))
        f_bpfo = (self.bearing_balls / 2.0) * fr * (1.0 - ratio)
        f_bpfi = (self.bearing_balls / 2.0) * fr * (1.0 + ratio)

        # 1. Current FFT analysis
        c_freqs, c_amps = self._fft_spectrum(current_signal)
        current_rms = float(np.sqrt(np.mean(current_signal ** 2)))

        # Fundamental component (50 Hz +/- 2 Hz)
        c_fund_amp = self._extract_band_amplitude(c_freqs, c_amps, fs, half_bandwidth=2.0)
        c_fund_amp = max(c_fund_amp, 1e-4)

        # Dominant frequency
        dominant_idx = np.argmax(c_amps)
        c_dominant_freq = float(c_freqs[dominant_idx])

        # Harmonics (3rd = 150 Hz, 5th = 250 Hz)
        c_harm_3 = self._extract_band_amplitude(c_freqs, c_amps, 3.0 * fs, half_bandwidth=3.0)
        c_harm_5 = self._extract_band_amplitude(c_freqs, c_amps, 5.0 * fs, half_bandwidth=3.0)
        current_harm_3_ratio = float(c_harm_3 / c_fund_amp)
        current_harm_5_ratio = float(c_harm_5 / c_fund_amp)

        # Total Harmonic Distortion (approx from dominant harmonics up to 7th)
        c_harm_7 = self._extract_band_amplitude(c_freqs, c_amps, 7.0 * fs, half_bandwidth=3.0)
        current_thd = float(np.sqrt(c_harm_3**2 + c_harm_5**2 + c_harm_7**2) / c_fund_amp)

        # Broken Rotor Bar Sidebands from Eq. (1): f_br = fs * (1 +/- 2*s)
        f_br_left = fs * (1.0 - 2.0 * slip)
        f_br_right = fs * (1.0 + 2.0 * slip)
        brb_left_amp = self._extract_band_amplitude(c_freqs, c_amps, f_br_left, half_bandwidth=1.0)
        brb_right_amp = self._extract_band_amplitude(c_freqs, c_amps, f_br_right, half_bandwidth=1.0)
        max_brb_amp = max(brb_left_amp, brb_right_amp)
        brb_sideband_ratio = float(max_brb_amp / c_fund_amp)

        # Eccentricity sidebands (fs +/- fr)
        ecc_left = self._extract_band_amplitude(c_freqs, c_amps, fs - fr, half_bandwidth=1.5)
        ecc_right = self._extract_band_amplitude(c_freqs, c_amps, fs + fr, half_bandwidth=1.5)
        eccentricity_sideband_amp = float(max(ecc_left, ecc_right))

        # 2. Vibration features
        vib_rms = float(np.sqrt(np.mean(vibration_signal ** 2)))
        vib_std = float(np.std(vibration_signal))
        vib_peak = float(np.max(np.abs(vibration_signal)))
        vib_peak_to_peak = float(np.ptp(vibration_signal))
        vib_crest_factor = float(vib_peak / max(vib_rms, 1e-4))
        vib_kurtosis = float(stats.kurtosis(vibration_signal, fisher=True))  # 0.0 for normal distribution
        vib_skewness = float(stats.skew(vibration_signal))

        # Vibration spectral band features
        v_freqs, v_amps = self._fft_spectrum(vibration_signal)
        vib_bpfo_energy = self._extract_band_energy(v_freqs, v_amps, f_bpfo, half_bandwidth=4.0)
        vib_bpfi_energy = self._extract_band_energy(v_freqs, v_amps, f_bpfi, half_bandwidth=4.0)
        vib_1x_shaft_amp = self._extract_band_amplitude(v_freqs, v_amps, fr, half_bandwidth=1.5)

        # 3. Temperature features
        temp_mean = float(temperature_c)
        temp_max = float(temperature_c)
        if prev_temperature_c is not None:
            # Rate of rise in °C / minute
            temp_rate_of_rise = float((temperature_c - prev_temperature_c) / (window_duration_s / 60.0))
        else:
            temp_rate_of_rise = 0.0

        features = {
            "current_rms": current_rms,
            "current_fundamental_amp": float(c_fund_amp),
            "current_dominant_freq": c_dominant_freq,
            "current_thd": current_thd,
            "current_harm_3_ratio": current_harm_3_ratio,
            "current_harm_5_ratio": current_harm_5_ratio,
            "brb_left_sideband_amp": float(brb_left_amp),
            "brb_right_sideband_amp": float(brb_right_amp),
            "brb_sideband_ratio": brb_sideband_ratio,
            "eccentricity_sideband_amp": eccentricity_sideband_amp,
            "vib_rms": vib_rms,
            "vib_std": vib_std,
            "vib_peak": vib_peak,
            "vib_peak_to_peak": vib_peak_to_peak,
            "vib_crest_factor": vib_crest_factor,
            "vib_kurtosis": vib_kurtosis,
            "vib_skewness": vib_skewness,
            "vib_bpfo_energy": vib_bpfo_energy,
            "vib_bpfi_energy": vib_bpfi_energy,
            "vib_1x_shaft_amp": float(vib_1x_shaft_amp),
            "temp_mean": temp_mean,
            "temp_max": temp_max,
            "temp_rate_of_rise": temp_rate_of_rise,
            "load_pct": float(load_pct),
            "estimated_speed_rpm": float(speed_rpm),
            "estimated_slip": float(slip)
        }

        return features

    def to_feature_vector(self, feature_dict: Dict[str, float]) -> np.ndarray:
        """Convert feature dict to ordered numpy array strictly adhering to FEATURE_NAMES."""
        return np.array([feature_dict[name] for name in FEATURE_NAMES], dtype=np.float64)
