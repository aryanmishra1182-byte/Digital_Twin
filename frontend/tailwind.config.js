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
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        canvas: {
          DEFAULT: '#090d16',
          subtle: '#0c1220',
        },
        panel: {
          DEFAULT: '#0f172a',
          hover: '#131e36',
          border: '#1e293b',
          'border-subtle': '#162238',
          'border-strong': '#334155',
        },
        surface: {
          DEFAULT: '#141e33',
          elevated: '#1a2742',
          muted: '#18243b',
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
          healthy: '#10b981',
          'healthy-bg': 'rgba(16, 185, 129, 0.08)',
          'healthy-border': 'rgba(16, 185, 129, 0.25)',
          warning: '#f59e0b',
          'warning-bg': 'rgba(245, 158, 11, 0.08)',
          'warning-border': 'rgba(245, 158, 11, 0.25)',
          critical: '#f43f5e',
          'critical-bg': 'rgba(244, 63, 94, 0.08)',
          'critical-border': 'rgba(244, 63, 94, 0.25)',
          info: '#38bdf8',
          'info-bg': 'rgba(56, 189, 248, 0.08)',
          'info-border': 'rgba(56, 189, 248, 0.25)',
        }
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'elevated': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
