/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1e3a5f", light: "#2d5a87", dark: "#0f2440" },
        accent: { DEFAULT: "#00d4aa", light: "#00f0c8", dark: "#00a884" },
      },
    },
  },
  plugins: [],
};
