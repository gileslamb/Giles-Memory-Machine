import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0d0d0d",
          elevated: "#141414",
          muted: "#1a1a1a",
        },
        border: {
          DEFAULT: "#262626",
          muted: "#1f1f1f",
        },
        ink: {
          DEFAULT: "#e5e5e5",
          muted: "#a3a3a3",
          faint: "#525252",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "monospace"],
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
