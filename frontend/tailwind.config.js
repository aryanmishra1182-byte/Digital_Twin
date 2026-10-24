/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)',
        panel: {
          DEFAULT: 'var(--panel)',
          hover: 'var(--track)',
          border: 'var(--rule)',
          'border-subtle': 'var(--rule)',
          'border-strong': 'var(--ink)',
        },
        ink: 'var(--ink)',
        mute: 'var(--mute)',
        rule: 'var(--rule)',
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        bad: 'var(--bad)',
        pos: 'var(--pos)',
        neg: 'var(--neg)',
        track: 'var(--track)',
        canvas: {
          DEFAULT: 'var(--bg)',
          subtle: 'var(--panel)',
        },
        surface: {
          DEFAULT: 'var(--panel)',
          elevated: 'var(--panel)',
          muted: 'var(--bg)',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        status: {
          healthy: 'var(--ok)',
          'healthy-bg': 'rgba(47, 107, 79, 0.12)',
          'healthy-border': 'var(--ok)',
          warning: 'var(--warn)',
          'warning-bg': 'rgba(183, 121, 31, 0.12)',
          'warning-border': 'var(--warn)',
          critical: 'var(--bad)',
          'critical-bg': 'rgba(194, 65, 12, 0.12)',
          'critical-border': 'var(--bad)',
          info: '#2d5d7b',
          'info-bg': 'rgba(45, 93, 123, 0.12)',
          'info-border': '#2d5d7b',
        }
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        'elevated': '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
