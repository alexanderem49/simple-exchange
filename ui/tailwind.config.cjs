/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./index.html"],
  theme: {
    extend: {
      margin: {
        '25': '6.25rem',
      },
      width: {
        '98/100': '98%',
      },
      minWidth: {
        '125': '125px'
      },
      spacing: {
        '2.5': '0.625rem',
        '20': '5rem',
        '25': '6.25rem',
        '28': '7rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}
