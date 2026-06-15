/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // La Causerie — a candle-lit salon at supper. Deep espresso wood, warm
        // cream linen, brass, and a glow of candle gold.
        espresso: {
          DEFAULT: "#1c130d", // the dark dining room
          deep: "#140d08",
          wood: "#2a1c12",
          warm: "#3a2618",
        },
        cream: {
          DEFAULT: "#f3e8d2", // table linen
          light: "#fbf4e4",
          dim: "#e6d6b8",
          muted: "#cdb892",
        },
        brass: {
          DEFAULT: "#c79a4b", // candlestick, frames
          light: "#e0bd73",
          deep: "#9c7430",
        },
        candle: "#f2c14e", // the flame
        claret: "#7a2230", // wine
        // Each figure gets a tasteful accent. A curated, muted-but-distinct set.
        salon: {
          plum: "#7c4d6d",
          wine: "#8a2f3b",
          forest: "#3f6b54",
          teal: "#2f6b6e",
          indigo: "#42507f",
          slate: "#4a5a66",
          rust: "#a35a36",
          gold: "#b58a3c",
          olive: "#6e7245",
          rose: "#a85769",
          sky: "#5a7a96",
          ash: "#6a5d57",
        },
      },
      fontFamily: {
        // Spectral (NOT Fraunces — a sibling app owns that). A humane sans below.
        display: ['"Spectral"', "Georgia", "serif"],
        sc: ['"Spectral SC"', "Georgia", "serif"],
        body: ['"Spectral"', "Georgia", "serif"],
        sans: ['"Outfit"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        candle: "0 0 40px -8px rgba(242, 193, 78, 0.28)",
        "candle-sm": "0 0 22px -6px rgba(242, 193, 78, 0.3)",
        plate: "0 18px 50px -18px rgba(0,0,0,0.7), 0 2px 0 0 rgba(199,154,75,0.18) inset",
        seat: "0 10px 30px -14px rgba(0,0,0,0.6)",
      },
      keyframes: {
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        flicker: {
          "0%, 100%": { opacity: "0.85", transform: "scale(1)" },
          "45%": { opacity: "1", transform: "scale(1.04)" },
          "70%": { opacity: "0.78", transform: "scale(0.98)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
        dots: {
          "0%, 80%, 100%": { opacity: "0.2", transform: "translateY(0)" },
          "40%": { opacity: "1", transform: "translateY(-3px)" },
        },
      },
      animation: {
        riseIn: "riseIn 0.5s ease-out both",
        flicker: "flicker 3.5s ease-in-out infinite",
        glowPulse: "glowPulse 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
