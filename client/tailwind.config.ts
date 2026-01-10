import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Core dark theme
                background: {
                    DEFAULT: "#0a0a0a",
                    secondary: "#141414",
                    elevated: "#1a1a1a",
                    card: "#0f0f0f",
                },
                // Accent colors (red dopamine trigger)
                accent: {
                    DEFAULT: "#dc2626",
                    light: "#ef4444",
                    dark: "#b91c1c",
                    glow: "rgba(220, 38, 38, 0.3)",
                },
                // Victory/Success
                victory: {
                    DEFAULT: "#dc2626",
                    bg: "#dc2626",
                },
                // Text
                foreground: {
                    DEFAULT: "#ffffff",
                    muted: "#a3a3a3",
                    dim: "#737373",
                },
                // Borders
                border: {
                    DEFAULT: "#262626",
                    light: "#404040",
                },
                // Status
                success: "#22c55e",
                warning: "#eab308",
                info: "#3b82f6",
            },
            fontFamily: {
                display: ["var(--font-bebas)", "Impact", "sans-serif"],
                body: ["var(--font-inter)", "system-ui", "sans-serif"],
                mono: ["var(--font-jetbrains)", "monospace"],
            },
            animation: {
                "pulse-glow": "pulse-glow 2s ease-in-out infinite",
                "slide-up": "slide-up 0.5s ease-out",
                "slide-in-right": "slide-in-right 0.3s ease-out",
                "fade-in": "fade-in 0.3s ease-out",
                "scale-in": "scale-in 0.3s ease-out",
                "number-tick": "number-tick 0.5s ease-out",
            },
            keyframes: {
                "pulse-glow": {
                    "0%, 100%": { boxShadow: "0 0 20px rgba(220, 38, 38, 0.3)" },
                    "50%": { boxShadow: "0 0 40px rgba(220, 38, 38, 0.6)" },
                },
                "slide-up": {
                    "0%": { transform: "translateY(20px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                "slide-in-right": {
                    "0%": { transform: "translateX(20px)", opacity: "0" },
                    "100%": { transform: "translateX(0)", opacity: "1" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "scale-in": {
                    "0%": { transform: "scale(0.9)", opacity: "0" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },
                "number-tick": {
                    "0%": { transform: "translateY(-100%)" },
                    "100%": { transform: "translateY(0)" },
                },
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "grid-pattern": "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            },
            boxShadow: {
                "glow-red": "0 0 30px rgba(220, 38, 38, 0.4)",
                "glow-red-lg": "0 0 60px rgba(220, 38, 38, 0.5)",
                "inner-glow": "inset 0 0 20px rgba(220, 38, 38, 0.2)",
            },
        },
    },
    plugins: [],
};

export default config;
