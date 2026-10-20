# Data Dictionary: Motor Telemetry and Feature Schema

## 1. Raw Telemetry Window
| Field Name | Type | Sampling Rate | Description |
|---|---|---|---|
| `motor_id` | String | Static | Asset identifier (e.g. `MOTOR-001`) |
| `run_id` | String | Static | Independent simulation or bench run ID |
| `timestamp` | Float / Instant | 1 Hz (window) | Timestamp of window initiation |
| `duration_s` | Float | 1.0 s | Analysis window duration |
| `load_pct` | Float | Metadata | Operating load point (25%, 50%, 75%, 100%) |
| `current_signal` | Float64 Array | 10 kHz | 10,000 samples of Phase A stator current (Amperes) |
| `vibration_signal` | Float64 Array | 10 kHz | 10,000 samples of radial vibration acceleration ($m/s^2$) |
| `temperature_c` | Float | Scalar | Motor winding temperature (°C) |

## 2. Physics-Guided Feature Schema (26 Ordered Features)
| Index | Feature Name | Domain | Physical Meaning / Purpose |
|---|---|---|---|
| 0 | `current_rms` | Current | Overall root mean square current draw (A) |
| 1 | `current_fundamental_amp` | Current | Fundamental amplitude at line supply frequency (50 Hz) |
| 2 | `current_dominant_freq` | Current | Spectral peak frequency (Hz) |
| 3 | `current_thd` | Current | Total harmonic distortion up to 7th harmonic |
| 4 | `current_harm_3_ratio` | Current | 3rd harmonic (150 Hz) ratio to fundamental (stator short indicator) |
| 5 | `current_harm_5_ratio` | Current | 5th harmonic (250 Hz) ratio to fundamental |
| 6 | `brb_left_sideband_amp` | Current | Amplitude at $f_s(1 - 2s) \approx 46$ Hz (broken rotor bar signature) |
| 7 | `brb_right_sideband_amp` | Current | Amplitude at $f_s(1 + 2s) \approx 54$ Hz (broken rotor bar signature) |
| 8 | `brb_sideband_ratio` | Current | Ratio of peak sideband to fundamental amplitude |
| 9 | `eccentricity_sideband_amp`| Current | Amplitude at $f_s \pm f_r$ (air-gap dynamic eccentricity) |
| 10 | `vib_rms` | Vibration | Overall root mean square vibration level ($m/s^2$) |
| 11 | `vib_std` | Vibration | Standard deviation of vibration signal |
| 12 | `vib_peak` | Vibration | Maximum absolute peak acceleration ($m/s^2$) |
| 13 | `vib_peak_to_peak` | Vibration | Peak-to-peak vibration amplitude ($m/s^2$) |
| 14 | `vib_crest_factor` | Vibration | Ratio of peak acceleration to RMS (impulsiveness indicator) |
| 15 | `vib_kurtosis` | Vibration | 4th standardized statistical moment (bearing impact indicator) |
| 16 | `vib_skewness` | Vibration | 3rd standardized statistical moment (asymmetry) |
| 17 | `vib_bpfo_energy` | Vibration | Spectral energy in Ball Pass Frequency Outer Race band (~80 Hz) |
| 18 | `vib_bpfi_energy` | Vibration | Spectral energy in Ball Pass Frequency Inner Race band (~135 Hz) |
| 19 | `vib_1x_shaft_amp` | Vibration | Vibration amplitude at shaft rotational frequency $f_r$ (~24 Hz) |
| 20 | `temp_mean` | Temperature | Mean winding temperature (°C) |
| 21 | `temp_max` | Temperature | Maximum observed temperature in window (°C) |
| 22 | `temp_rate_of_rise` | Temperature | Rate of thermal increase $\Delta T / \Delta t$ (°C/min) |
| 23 | `load_pct` | Metadata | Operating load percentage (25, 50, 75, 100) |
| 24 | `estimated_speed_rpm` | Metadata | Calculated operating rotor speed in RPM ($1500 \times (1 - s)$) |
| 25 | `estimated_slip` | Metadata | Motor operational slip under load ($0.04 \times \text{Load}$) |
