/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#faf7f2',
          100: '#f5f0e8',
          200: '#ede8d8',
          300: '#e0d5c0',
          400: '#d4c4a8',
          500: '#c2956b',
          600: '#a87d56',
          700: '#8b6544',
          800: '#6e4f35',
          900: '#4a3525',
        },
        meaning: '#8b7355',
      },
    },
  },
  plugins: [],
};
