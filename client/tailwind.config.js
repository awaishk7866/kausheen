/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6366f1', dark: '#4f46e5', light: '#a5b4fc' },
        surface: { DEFAULT: '#1e1e2e', card: '#2a2a3e', border: '#3a3a52' },
        success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
};
