import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CSS variable-based colors for theme switching
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          elevated: "rgb(var(--surface-elevated) / <alpha-value>)",
        },
        border: "rgb(var(--border) / 0.5)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        // Primary Blue - Paymob style
        primary: {
          DEFAULT: "#2266FF",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2266FF",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // Navy for headings
        navy: "#0A1F58",
        // Status colors
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        // Channel colors
        whatsapp: "#25D366",
        messenger: "#0084FF",
        telegram: "#0088cc",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Arabic", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        "soft": "0 2px 8px rgba(10, 31, 88, 0.08)",
        "soft-lg": "0 4px 16px rgba(10, 31, 88, 0.12)",
        "glow": "0 0 20px rgba(34, 102, 255, 0.15)",
        "glow-lg": "0 0 40px rgba(34, 102, 255, 0.2)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "spotlight": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "slide-up": "slide-up 150ms ease-out",
        "slide-down": "slide-down 150ms ease-out",
        "slide-in-right": "slide-in-right 150ms ease-out",
        "slide-in-left": "slide-in-left 150ms ease-out",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "spotlight": "spotlight 200ms ease-out",
        "bounce-subtle": "bounce-subtle 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
