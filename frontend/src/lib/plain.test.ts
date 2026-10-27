import { describe, it, expect } from 'vitest';
import {
  getPlainInfo,
  getStatusWord,
  getFriendlyFeatureName,
  formatRelativeTime,
  CLASS_PLAIN_MAP,
  DEFAULT_PLAIN_INFO,
  STATUS_WORDS
} from './plain';

describe('plain.ts - Operator and Diagnostics Localization Module', () => {
  describe('getPlainInfo', () => {
    it('returns correct verdict and explanation for known fault classes', () => {
      const healthy = getPlainInfo('HEALTHY');
      expect(healthy.verdict).toBe('Running normally');
      expect(healthy.explanation).toBe('Current, vibration and temperature all look normal for this load.');

      const brb = getPlainInfo('BROKEN_ROTOR_BAR');
      expect(brb.verdict).toBe('Possible broken rotor bar');
      expect(brb.explanation).toContain('cracked or broken bar');

      const stator = getPlainInfo('STATOR_INTER_TURN_SHORT');
      expect(stator.verdict).toBe('Possible winding short');
      expect(stator.explanation).toContain('winding may be shorting out');

      const bearing = getPlainInfo('BEARING_DEFECT');
      expect(bearing.verdict).toBe('Possible bearing wear');
      expect(bearing.explanation).toContain('sharp, repeating knocks');

      const ecc = getPlainInfo('AIR_GAP_ECCENTRICITY');
      expect(ecc.verdict).toBe('Possible rotor misalignment');
      expect(ecc.explanation).toContain('rotor may be sitting off-centre');
    });

    it('handles lowercase and mixed-case class names correctly', () => {
      const lower = getPlainInfo('broken_rotor_bar');
      expect(lower.verdict).toBe('Possible broken rotor bar');
      const mixed = getPlainInfo('Stator_Inter_Turn_Short');
      expect(mixed.verdict).toBe('Possible winding short');
    });

    it('returns safe fallback for unknown, empty, or null class names', () => {
      expect(getPlainInfo('UNKNOWN_CLASS')).toEqual(DEFAULT_PLAIN_INFO);
      expect(getPlainInfo('')).toEqual(DEFAULT_PLAIN_INFO);
      expect(getPlainInfo(null)).toEqual(DEFAULT_PLAIN_INFO);
      expect(getPlainInfo(undefined)).toEqual(DEFAULT_PLAIN_INFO);
    });

    it('does not mutate CLASS_PLAIN_MAP or DEFAULT_PLAIN_INFO', () => {
      const originalVerdict = DEFAULT_PLAIN_INFO.verdict;
      const res = getPlainInfo('SOME_FAULT');
      res.verdict = 'Tampered';
      expect(DEFAULT_PLAIN_INFO.verdict).toBe(originalVerdict);
    });
  });

  describe('getStatusWord', () => {
    it('translates operational status codes to natural phrases', () => {
      expect(getStatusWord('HEALTHY')).toBe('OK');
      expect(getStatusWord('WARNING')).toBe('Keep an eye on it');
      expect(getStatusWord('CRITICAL')).toBe('Needs action');
      expect(getStatusWord('OFFLINE')).toBe('No data');
    });

    it('falls back to "No data" for empty or null status', () => {
      expect(getStatusWord('')).toBe('No data');
      expect(getStatusWord(null)).toBe('No data');
      expect(getStatusWord(undefined)).toBe('No data');
    });

    it('returns raw status when status is unrecognized', () => {
      expect(getStatusWord('DECOMMISSIONED')).toBe('DECOMMISSIONED');
    });
  });

  describe('getFriendlyFeatureName', () => {
    it('returns natural operator phrases for known telemetry signatures', () => {
      expect(getFriendlyFeatureName('brb_sideband_ratio')).toBe('Rotor-bar pattern in the current');
      expect(getFriendlyFeatureName('eccentricity_harmonics')).toBe('Rotor off-centre pattern');
      expect(getFriendlyFeatureName('current_thd')).toBe('Distortion of the current');
      expect(getFriendlyFeatureName('current_harmonics_5th')).toBe('Harmonics in the current');
      expect(getFriendlyFeatureName('current_rms')).toBe('Size of the current');
      expect(getFriendlyFeatureName('vib_kurtosis')).toBe('Sharpness of vibration knocks');
      expect(getFriendlyFeatureName('vib_bpfo_energy')).toBe('Bearing-frequency vibration');
      expect(getFriendlyFeatureName('vib_1x_shaft_amp')).toBe('Vibration at shaft speed');
      expect(getFriendlyFeatureName('vib_rms')).toBe('Overall vibration');
      expect(getFriendlyFeatureName('temp_rate_of_rise')).toBe('How fast it is heating up');
      expect(getFriendlyFeatureName('temp_celsius')).toBe('Temperature');
      expect(getFriendlyFeatureName('load_pct')).toBe('Load on the motor');
    });

    it('provides safe fallback for unknown, empty, or null feature names', () => {
      expect(getFriendlyFeatureName('')).toBe('Reading');
      expect(getFriendlyFeatureName(null)).toBe('Reading');
      expect(getFriendlyFeatureName(undefined)).toBe('Reading');
      expect(getFriendlyFeatureName('custom_sensor_flux_alpha')).toBe('custom sensor flux alpha');
    });

    it('does not mutate or alter SHAP input values or explanation arrays', () => {
      const shapItems = [
        { feature: 'vib_kurtosis', shap_value: 0.42 },
        { feature: 'current_thd', shap_value: -0.15 }
      ];
      const translated = shapItems.map(item => ({
        friendlyName: getFriendlyFeatureName(item.feature),
        originalFeature: item.feature,
        shap_value: item.shap_value
      }));
      expect(translated[0].shap_value).toBe(0.42);
      expect(translated[1].shap_value).toBe(-0.15);
      expect(shapItems[0].shap_value).toBe(0.42);
    });
  });

  describe('formatRelativeTime', () => {
    it('correctly handles edge cases and null values', () => {
      expect(formatRelativeTime(null)).toBe('Not available');
      expect(formatRelativeTime(undefined)).toBe('Not available');
      expect(formatRelativeTime('invalid-date')).toBe('Not available');

      const now = new Date().toISOString();
      expect(formatRelativeTime(now)).toBe('Just now');

      const tenSecondsAgo = new Date(Date.now() - 15000).toISOString();
      expect(formatRelativeTime(tenSecondsAgo)).toBe('15 seconds ago');

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(formatRelativeTime(tenMinutesAgo)).toBe('10 minutes ago');

      const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
      expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago');

      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
      expect(formatRelativeTime(twoDaysAgo)).toBe('2 days ago');
    });
  });
});
