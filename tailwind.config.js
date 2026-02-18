/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        'background-light': '#f3f4f6',
        'background-dark': '#0f172a',
        'panel-light': '#ffffff',
        'panel-dark': '#1e293b',
        'border-light': '#e2e8f0',
        'border-dark': '#334155',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
      },
    },
  },
  plugins: [],
};
