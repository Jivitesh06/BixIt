/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./context/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:  "#131b2e",
        orange:   "#F97316",
        "orange-d": "#fd761a",
        surface:  "#f7f9fb",
        "surface-2": "#f2f4f6",
        border:   "#e0e3e5",
        muted:    "#76777d",
        sub:      "#45464d",
      },
      fontFamily: {
        headline: ["Manrope", "Noto Sans Devanagari", "sans-serif"],
        deva:     ["Noto Sans Devanagari", "sans-serif"],
      },
      borderWidth: {
        3: "3px",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
