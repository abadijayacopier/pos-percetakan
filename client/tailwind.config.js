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
        sans: ['"Fira Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fira Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        code: ['"Fira Code"', 'ui-monospace', 'monospace'],
      },
      colors: {
        primary: '#137fec',
        'primary-light': '#4aa3ff',
        'primary-dark': '#0d6bd1',
        'background-light': '#f6f7f8',
        'background-dark': '#101922',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwind-scrollbar'),
  ],
}
