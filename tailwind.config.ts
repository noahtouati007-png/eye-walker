import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        surface: "#12121a",
        card: "#1a1a28",
        border: "#2a2a40",
        "text-primary": "#f0f0ff",
        "text-secondary": "#8888aa",
        accent: {
          blue: "#00d4ff",
          purple: "#a855f7",
          orange: "#f97316",
          green: "#22c55e",
          red: "#ef4444",
          yellow: "#eab308",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-orbitron)", "var(--font-geist-sans)", "sans-serif"],
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.8" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
