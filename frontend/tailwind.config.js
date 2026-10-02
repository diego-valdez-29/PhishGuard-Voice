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
        soc: {
          dark: '#0F172A',
          darker: '#090D16',
          card: '#1E293B',
          border: '#334155',
          safe: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
          accent: '#3B82F6',
          cyan: '#06B6D4',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'siren': 'sirenFlash 1s infinite alternate',
      },
      keyframes: {
        sirenFlash: {
          '0%': { boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)' },
          '100%': { boxShadow: '0 0 35px rgba(239, 68, 68, 0.85)' },
        }
      }
    },
  },
  plugins: [],
}
