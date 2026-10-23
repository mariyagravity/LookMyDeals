/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D9488', // Teal-600
          strong: '#059669',  // Emerald-600
          light: '#F0FDFA',   // Teal-50
          dark: '#115E59',    // Teal-800
        },
        ink: {
          DEFAULT: '#0F172A', // Slate-900
          light: '#334155',   // Slate-700
          muted: '#64748B',   // Slate-500
        },
        surface: {
          DEFAULT: '#F8FAFC', // Slate-50
          card: '#FFFFFF',
          border: '#E2E8F0',  // Slate-200
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
