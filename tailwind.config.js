/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        matrix: {
          black: '#000000',
          darkgreen: '#003B00',
          green: '#00FF41',
          lightgreen: '#00FF41',
          glow: '#39FF14',
        }
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'VT323', 'monospace'],
        crt: ['VT323', 'monospace'],
      },
      animation: {
        'flicker': 'flicker 0.15s infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.9' },
        },
        scan: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        }
      },
      ringColor: {
        matrix: {
          DEFAULT: '#00FF41',
          green: '#00FF41',
        }
      }
    },
  },
  plugins: [],
}