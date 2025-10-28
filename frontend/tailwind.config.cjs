/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        berisso: {
          50: "#f7fbf6",
          100: "#ecf7ea",
          200: "#d0efd0",
          300: "#b2e6b3",
          400: "#7fe07f",
          500: "#3ec04a",
          600: "#33993b",
          700: "#23772b",
          800: "#19571f",
          900: "#113d17",
        },
        berissoBlue: { 500: "#0b63d6" },
        berissoGold: { 500: "#ffd400" },
      },
      boxShadow: {
        card: "0 6px 18px rgba(15, 23, 42, 0.08)",
      },
      screens: {
        xs: "420px",
      },
    },
  },
  plugins: [],
};

