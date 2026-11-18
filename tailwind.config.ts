import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f4f9",
          100: "#dbe4ef",
          200: "#b7cae0",
          300: "#88a7cc",
          400: "#5981b5",
          500: "#38639e",
          600: "#294d80",
          700: "#223f68",
          800: "#1e3656",
          900: "#172D4A",
          950: "#0e1a2c",
        },
        gold: {
          50: "#fdfbf7",
          100: "#f9f4ea",
          200: "#f1e4ce",
          300: "#e6d1ab",
          400: "#dfbd83",
          500: "#D6A85F",
          600: "#c2934b",
          700: "#a17639",
          800: "#825e31",
          900: "#6a4e2b",
        },
        ivory: {
          DEFAULT: "#F7F5F0",
          50: "#FAF9F5",
          100: "#F7F5F0",
          200: "#EFECE3",
          300: "#E4DECf",
        },
        surface: {
          DEFAULT: "#FAFAF8",
          card: "#FFFFFF",
        },
        primaryText: "#202938",
        secondaryText: "#718096",
        borderBase: "#E7EAF0",
        success: {
          DEFAULT: "#15966B",
          dark: "#0e7250",
          light: "#e6f7f1",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", '"Times New Roman"', "Times", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

