/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#E11B22',
          'red-dark': '#B80D13',
          'red-light': '#FFF0F0',
          yellow: '#FFC20E',
          'yellow-dark': '#D49E00',
          'yellow-light': '#FFFBEB',
          blue: '#005596',
          'blue-dark': '#003E6E',
          'blue-light': '#EFF6FF',
          green: '#10B981',
          'green-dark': '#047857',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'floating': '0 10px 30px -5px rgba(225, 27, 34, 0.25)',
      }
    },
  },
  plugins: [],
}
