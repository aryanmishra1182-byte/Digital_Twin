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
        sans: ['"Inter"', '"Hanken Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Aerospace Mission Control Color Palette
        bg: {
          DEFAULT: '#F2F5F8',
          dark: '#0C131F',
        },
        panel: {
          DEFAULT: '#FFFFFF',
          subtle: '#F7F9FB',
          dark: '#101B2A',
          'dark-subtle': '#18273A',
        },
        surface: {
          secondary: '#E9EEF4',
          'secondary-dark': '#152233',
        },
        ink: {
          DEFAULT: '#142337',
          secondary: '#586A7F',
          muted: '#7B8999',
          inverse: '#F4F7FB',
        },
        aerospace: {
          DEFAULT: '#2458D3',
          bright: '#3979F6',
          pale: '#E8F0FF',
          dark: '#1B42A3',
          'pale-dark': '#13284C',
        },
        telemetry: {
          cyan: '#11A7B5',
          'cyan-dark': '#0E8591',
          'cyan-pale': '#E6F8FA',
        },
        rule: {
          DEFAULT: '#DCE4ED',
          dark: '#1E2D42',
        },
        state: {
          normal: '#16856B',
          'normal-pale': '#E7F5F0',
          warning: '#D58B22',
          'warning-pale': '#FDF5E8',
          critical: '#D74444',
          'critical-pale': '#FDECEC',
          info: '#3979F6',
          'info-pale': '#EBF2FE',
          unavailable: '#7B8999',
        },
        // IBM Watson IoT Device Status Board Color Palette
        watson: {
          shell: '#102A38',
          rail: '#0B202C',
          railBorder: '#1C3B4E',
          panel: '#FFFFFF',
          panelSubtle: '#F8FAFC',
          panelHeader: '#F1F5F9',
          panelBorder: '#E2E8F0',
          purple: '#68409A',
          purpleLight: '#F3EBF9',
          blue: '#355D8B',
          blueLight: '#EBF3FA',
          textMain: '#253746',
          textSecondary: '#718096',
          textMuted: '#94A3B8',
          telemetry: '#9B6DCC',
          ok: '#27866F',
          okLight: '#E8F6F2',
          warn: '#D99A35',
          warnLight: '#FEF6E9',
          bad: '#C94B50',
          badLight: '#FDF0F1',
        },
      },
    },
  },
  plugins: [],
}
