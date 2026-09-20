/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#FDF9EE",
          100: "#FAF1D5",
          200: "#F5E2A8",
          300: "#EFD078",
          400: "#EABF4D",
          500: "#E5A93C",
          600: "#D3942C",
          700: "#AF7420",
          800: "#8C581D",
          900: "#73461A",
          DEFAULT: "#E5A93C",
          light: "#F5C767",
          dark: "#C58B24",
          border: "#D69E3D",
        },
        brand: {
          black: "#060606",
          dark: "#0C0C0C",
          card: "#0E0E0E",
          cardBorder: "#D69E3D",
          inputBorder: "#E5A93C",
          muted: "#8E8E93",
          subtle: "#555555",
        },
      },
      boxShadow: {
        'gold-glow': '0 0 25px rgba(229, 169, 60, 0.18)',
        'gold-glow-lg': '0 0 45px rgba(229, 169, 60, 0.28)',
        'gold-btn': '0 4px 20px rgba(229, 169, 60, 0.35)',
      }
    },
  },
  plugins: [],
};
