import { describe, it, expect } from 'vitest';
import {
  getPlainInfo,
  getStatusWord,
  getFriendlyFeatureName,
  formatRelativeTime,
  CLASS_PLAIN_MAP
} from '../src/lib/plain';

describe('Plain language wording mapping', () => {
  it('maps HEALTHY to running normally', () => {
    const info = getPlainInfo('HEALTHY');
    expect(info.verdict).toBe('Running normally');
    expect(info.explanation).toBe('Current, vibration and temperature all look normal for this load.');
  });

  it('maps BROKEN_ROTOR_BAR to cracked or broken bar', () => {
    const info = getPlainInfo('BROKEN_ROTOR_BAR');
    expect(info.verdict).toBe('Possible broken rotor bar');
    expect(info.explanation).toContain('cracked or broken bar');
  });

  it('maps STATOR_INTER_TURN_SHORT to winding short', () => {
    const info = getPlainInfo('STATOR_INTER_TURN_SHORT');
    expect(info.verdict).toBe('Possible winding short');
    expect(info.explanation).toContain('winding may be shorting out');
  });

  it('maps BEARING_DEFECT to bearing wear', () => {
    const info = getPlainInfo('BEARING_DEFECT');
    expect(info.verdict).toBe('Possible bearing wear');
    expect(info.explanation).toContain('sharp, repeating knocks');
  });

  it('maps AIR_GAP_ECCENTRICITY to rotor misalignment', () => {
    const info = getPlainInfo('AIR_GAP_ECCENTRICITY');
    expect(info.verdict).toBe('Possible rotor misalignment');
    expect(info.explanation).toContain('rotor may be sitting off-centre');
  });

  it('handles unknown classes with gentle unusual reading fallback', () => {
    const info = getPlainInfo('UNKNOWN_ANOMALOUS_STATE');
    expect(info.verdict).toBe('Unusual reading');
    expect(info.explanation).toBe('The model flagged this reading as different from normal.');
  });

  it('maps operational state words without tech acronyms', () => {
    expect(getStatusWord('HEALTHY')).toBe('OK');
    expect(getStatusWord('WARNING')).toBe('Keep an eye on it');
    expect(getStatusWord('CRITICAL')).toBe('Needs action');
    expect(getStatusWord('OFFLINE')).toBe('No data');
  });
});

describe('Friendly feature name mappings', () => {
  it('converts rotor bar current signatures', () => {
    expect(getFriendlyFeatureName('brb_sideband_ratio')).toBe('Rotor-bar pattern in the current');
  });

  it('converts eccentricity signatures', () => {
    expect(getFriendlyFeatureName('eccentricity_harmonics')).toBe('Rotor off-centre pattern');
  });

  it('converts current distortion and harmonics', () => {
    expect(getFriendlyFeatureName('current_thd')).toBe('Distortion of the current');
    expect(getFriendlyFeatureName('current_harmonics_5th')).toBe('Harmonics in the current');
    expect(getFriendlyFeatureName('current_rms')).toBe('Size of the current');
  });

  it('converts vibration features', () => {
    expect(getFriendlyFeatureName('vib_kurtosis')).toBe('Sharpness of vibration knocks');
    expect(getFriendlyFeatureName('vib_bpfo_energy')).toBe('Bearing-frequency vibration');
    expect(getFriendlyFeatureName('vib_1x_shaft_amp')).toBe('Vibration at shaft speed');
    expect(getFriendlyFeatureName('vib_rms')).toBe('Overall vibration');
  });

  it('converts temperature and load features', () => {
    expect(getFriendlyFeatureName('temp_rate_of_rise')).toBe('How fast it is heating up');
    expect(getFriendlyFeatureName('temp_celsius')).toBe('Temperature');
    expect(getFriendlyFeatureName('load_pct')).toBe('Load on the motor');
  });
});

describe('Relative time formatting', () => {
  it('formats recent timestamps gracefully', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('Just now');

    const tenSecAgo = new Date(Date.now() - 12000).toISOString();
    expect(formatRelativeTime(tenSecAgo)).toBe('12 seconds ago');

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe('5 minutes ago');

    expect(formatRelativeTime(null)).toBe('Not available');
  });
});
