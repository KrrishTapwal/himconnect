/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          700: '#0D7C4D',
          800: '#0a6340',
          600: '#12a368',
          50: '#f0fdf6'
        },
        orange: {
          500: '#F97316',
          400: '#fb923c',
          50: '#fff7ed'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
