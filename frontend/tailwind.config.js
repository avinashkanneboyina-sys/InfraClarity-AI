/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070b14',
          900: '#0b1329',
          850: '#0f1a36',
          800: '#142247',
          700: '#1c3166',
          600: '#27448c',
        },
        electric: {
          500: '#0070f3',
          400: '#0099ff',
          300: '#38bdf8',
          200: '#7dd3fc',
        },
        cyan: {
          450: '#00d2d3',
          550: '#00a8a8'
        },
        warning: {
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
