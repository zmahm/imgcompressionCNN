/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neural: {
          950: '#020817',
          900: '#0a1628',
          800: '#0f2040',
          700: '#162a55',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow': 'flow 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        flow: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(6,182,212,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(6,182,212,0.8), 0 0 40px rgba(6,182,212,0.4)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
