import type { Config } from "tailwindcss";

/**
 * BLACKROOT token system.
 * void        #050D09  near-black with a green cast — the base you're breaching into
 * panel       #0A1912  raised surfaces (cards, nav, console panels)
 * panelRaised #10241A  hover/active surface state
 * hairline    #1E4634  borders, dividers — visible but quiet
 * jade        #2FE6A6  primary accent — links, active states, unlocked content
 * emerald     #0E6B4C  secondary accent — deeper, used for large fills/badges
 * mint        #DFFFEE  near-white sparkle — used sparingly for emphasis glints
 * signal      #FF6B4A  warm amber-red — reserved for locked/danger states only
 * muted       #6E9683  de-emphasized text (timestamps, meta)
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050D09",
        panel: "#0A1912",
        panelRaised: "#10241A",
        hairline: "#1E4634",
        jade: "#2FE6A6",
        emerald: "#0E6B4C",
        mint: "#DFFFEE",
        signal: "#FF6B4A",
        muted: "#6E9683",
      },
      fontFamily: {
        display: ["'JetBrains Mono'", "monospace"],
        mono: ["'IBM Plex Mono'", "monospace"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px -6px rgba(47, 230, 166, 0.45)",
        glowSm: "0 0 12px -4px rgba(47, 230, 166, 0.5)",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "8%": { opacity: "0.4" },
          "10%": { opacity: "1" },
          "20%": { opacity: "0.7" },
          "22%": { opacity: "1" },
        },
        sparkle: {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
          "100%": { opacity: "0", transform: "scale(0.6)" },
        },
      },
      animation: {
        scan: "scan 4s linear infinite",
        flicker: "flicker 6s ease-in-out infinite",
        sparkle: "sparkle 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
