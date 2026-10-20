"""
Unit and Physics-Consistency Tests for Simulator and Feature Extractor
"""

import pytest
import numpy as np
import sys
import os

# Add repository root to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from simulator.motor_simulator import MotorSimulator, MotorParams, FAULT_CLASSES
from ml.features.feature_extractor import FeatureExtractor, FEATURE_NAMES

def test_simulator_window_dimensions():
    sim = MotorSimulator(seed=123)
    window = sim.generate_window(run_id="TEST-001", load_pct=100.0, fault_class="HEALTHY")
    assert len(window.current_signal) == 10000
    assert len(window.vibration_signal) == 10000
    assert window.sampling_rate_hz == 10000
    assert window.duration_s == 1.0
    assert np.isfinite(window.current_signal).all()
    assert np.isfinite(window.vibration_signal).all()
    assert 20.0 <= window.temperature_c <= 120.0

def test_feature_extractor_schema_and_ordering():
    sim = MotorSimulator(seed=123)
    extractor = FeatureExtractor()
    window = sim.generate_window(run_id="TEST-002", load_pct=100.0, fault_class="HEALTHY")
    features = extractor.extract_features(
        current_signal=window.current_signal,
        vibration_signal=window.vibration_signal,
        temperature_c=window.temperature_c,
        prev_temperature_c=window.prev_temperature_c,
        load_pct=window.load_pct
    )
    assert len(features) == len(FEATURE_NAMES)
    for name in FEATURE_NAMES:
        assert name in features
        assert np.isfinite(features[name])

    vec = extractor.to_feature_vector(features)
    assert len(vec) == len(FEATURE_NAMES)
    assert vec.dtype == np.float64

def test_broken_rotor_bar_physics_signature():
    """Verify that broken rotor bar exhibits higher sideband ratio than healthy."""
    sim_healthy = MotorSimulator(seed=42)
    sim_faulty = MotorSimulator(seed=42)
    extractor = FeatureExtractor()

    w_healthy = sim_healthy.generate_window(load_pct=100.0, fault_class="HEALTHY", severity=0.0)
    w_faulty = sim_faulty.generate_window(load_pct=100.0, fault_class="BROKEN_ROTOR_BAR", severity=0.8)

    f_healthy = extractor.extract_features(w_healthy.current_signal, w_healthy.vibration_signal, w_healthy.temperature_c)
    f_faulty = extractor.extract_features(w_faulty.current_signal, w_faulty.vibration_signal, w_faulty.temperature_c)

    # Sideband ratio for broken rotor bar must be significantly higher
    assert f_faulty["brb_sideband_ratio"] > f_healthy["brb_sideband_ratio"] * 2.0
    assert f_faulty["brb_left_sideband_amp"] > f_healthy["brb_left_sideband_amp"]
    assert f_faulty["brb_right_sideband_amp"] > f_healthy["brb_right_sideband_amp"]

def test_bearing_defect_physics_signature():
    """Verify that bearing defect produces higher kurtosis and BPFO band energy."""
    sim_healthy = MotorSimulator(seed=42)
    sim_bearing = MotorSimulator(seed=42)
    extractor = FeatureExtractor()

    w_healthy = sim_healthy.generate_window(load_pct=100.0, fault_class="HEALTHY", severity=0.0)
    w_bearing = sim_bearing.generate_window(load_pct=100.0, fault_class="BEARING_DEFECT", severity=0.8)

    f_healthy = extractor.extract_features(w_healthy.current_signal, w_healthy.vibration_signal, w_healthy.temperature_c)
    f_bearing = extractor.extract_features(w_bearing.current_signal, w_bearing.vibration_signal, w_bearing.temperature_c)

    # Impulsive bearing impacts increase kurtosis and BPFO energy
    assert f_bearing["vib_kurtosis"] > f_healthy["vib_kurtosis"]
    assert f_bearing["vib_bpfo_energy"] > f_healthy["vib_bpfo_energy"] * 2.0

def test_stator_inter_turn_short_physics_signature():
    """Verify that stator short causes elevated 3rd harmonic ratio."""
    sim_healthy = MotorSimulator(seed=42)
    sim_short = MotorSimulator(seed=42)
    extractor = FeatureExtractor()

    w_healthy = sim_healthy.generate_window(load_pct=100.0, fault_class="HEALTHY", severity=0.0)
    w_short = sim_short.generate_window(load_pct=100.0, fault_class="STATOR_INTER_TURN_SHORT", severity=0.8)

    f_healthy = extractor.extract_features(w_healthy.current_signal, w_healthy.vibration_signal, w_healthy.temperature_c)
    f_short = extractor.extract_features(w_short.current_signal, w_short.vibration_signal, w_short.temperature_c)

    assert f_short["current_harm_3_ratio"] > f_healthy["current_harm_3_ratio"] * 2.0

def test_eccentricity_physics_signature():
    """Verify that air-gap eccentricity increases 1x shaft vibration and eccentricity sidebands."""
    sim_healthy = MotorSimulator(seed=42)
    sim_ecc = MotorSimulator(seed=42)
    extractor = FeatureExtractor()

    w_healthy = sim_healthy.generate_window(load_pct=100.0, fault_class="HEALTHY", severity=0.0)
    w_ecc = sim_ecc.generate_window(load_pct=100.0, fault_class="AIR_GAP_ECCENTRICITY", severity=0.8)

    f_healthy = extractor.extract_features(w_healthy.current_signal, w_healthy.vibration_signal, w_healthy.temperature_c)
    f_ecc = extractor.extract_features(w_ecc.current_signal, w_ecc.vibration_signal, w_ecc.temperature_c)

    assert f_ecc["vib_1x_shaft_amp"] > f_healthy["vib_1x_shaft_amp"]
    assert f_ecc["eccentricity_sideband_amp"] > f_healthy["eccentricity_sideband_amp"]
