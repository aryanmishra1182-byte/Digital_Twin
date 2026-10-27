/**
 * Plain-language mappings for plant operators and maintenance technicians.
 * Strictly adheres to the wording specification table and jargon rules.
 */

export interface ClassPlainInfo {
  verdict: string;
  explanation: string;
}

export const CLASS_PLAIN_MAP: Record<string, ClassPlainInfo> = {
  HEALTHY: {
    verdict: 'Running normally',
    explanation: 'Current, vibration and temperature all look normal for this load.'
  },
  BROKEN_ROTOR_BAR: {
    verdict: 'Possible broken rotor bar',
    explanation: 'The motor current shows a pattern that points to a cracked or broken bar in the rotor.'
  },
  STATOR_INTER_TURN_SHORT: {
    verdict: 'Possible winding short',
    explanation: 'Part of the winding may be shorting out, which makes the motor run hotter and draw uneven current.'
  },
  BEARING_DEFECT: {
    verdict: 'Possible bearing wear',
    explanation: 'The vibration has sharp, repeating knocks, which is typical of a worn bearing.'
  },
  AIR_GAP_ECCENTRICITY: {
    verdict: 'Possible rotor misalignment',
    explanation: 'The rotor may be sitting off-centre, which adds extra vibration at shaft speed.'
  }
};

export const DEFAULT_PLAIN_INFO: ClassPlainInfo = {
  verdict: 'Unusual reading',
  explanation: 'The model flagged this reading as different from normal.'
};

export function getPlainInfo(faultClass?: string | null): ClassPlainInfo {
  if (!faultClass) return { ...DEFAULT_PLAIN_INFO };
  const upper = faultClass.toUpperCase();
  const match = CLASS_PLAIN_MAP[upper];
  return match ? { ...match } : { ...DEFAULT_PLAIN_INFO };
}

export const STATUS_WORDS: Record<string, string> = {
  HEALTHY: 'OK',
  WARNING: 'Keep an eye on it',
  CRITICAL: 'Needs action',
  OFFLINE: 'No data'
};

export function getStatusWord(status?: string | null): string {
  if (!status) return 'No data';
  return STATUS_WORDS[status.toUpperCase()] || status;
}

/**
 * Maps technical telemetry/feature identifiers to operator-friendly phrases.
 */
export function getFriendlyFeatureName(rawName?: string | null): string {
  if (!rawName) return 'Reading';
  const name = rawName.toLowerCase();
  if (name.startsWith('brb_') || name.includes('rotor_bar')) {
    return 'Rotor-bar pattern in the current';
  }
  if (name.startsWith('eccentricity') || name.includes('eccentric')) {
    return 'Rotor off-centre pattern';
  }
  if (name === 'current_thd' || name.includes('thd')) {
    return 'Distortion of the current';
  }
  if (name.startsWith('current_harm') || name.includes('harmonics')) {
    return 'Harmonics in the current';
  }
  if (name === 'current_rms') {
    return 'Size of the current';
  }
  if (name.includes('kurtosis')) {
    return 'Sharpness of vibration knocks';
  }
  if (name.includes('bpfo') || name.includes('bpfi') || name.includes('bearing_freq')) {
    return 'Bearing-frequency vibration';
  }
  if (name.startsWith('vib_1x') || name.includes('1x_shaft')) {
    return 'Vibration at shaft speed';
  }
  if (name.startsWith('vib_') || name.includes('vibration')) {
    return 'Overall vibration';
  }
  if (name.startsWith('temp_rate') || name.includes('rate_of_rise')) {
    return 'How fast it is heating up';
  }
  if (name.startsWith('temp_') || name.includes('temperature')) {
    return 'Temperature';
  }
  if (name.startsWith('load')) {
    return 'Load on the motor';
  }
  return rawName.replace(/_/g, ' ');
}

/**
 * Formats a timestamp into a natural relative phrase (e.g. "12 seconds ago").
 */
export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return 'Not available';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Not available';
  const diffSec = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  const diffDay = Math.round(diffHour / 24);
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
}
