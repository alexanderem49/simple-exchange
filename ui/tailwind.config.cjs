/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./index.html"],
  theme: {
    extend: {
      minWidth: {
        '125': '125px'
      }
    },
  },
  plugins: [],
}
