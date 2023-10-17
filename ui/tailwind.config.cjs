/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./index.html"],
  theme: {
    extend: {
      minWidth: {
        '125': '125px'
      },
      spacing: {
        '25': '6.25rem',
        '28': '7rem',
      },
    },
  },
  plugins: [],
}
