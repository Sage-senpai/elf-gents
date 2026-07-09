import type { Config } from "tailwindcss";

/* Discord layout + Elf theming: blurple hero & chunky shapes (Discord),
   deep forest greens + warm cream (Elf brand). */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blurple: { DEFAULT: "#5865F2", dark: "#4752C4", light: "#7C86F6" },
        night: "#161A1E", // Elf dark bg — darkest surface (footer / dark sections)
        slate: "#1F2A26", // raised dark card (green-tinted)
        cream: "#F1EFE8", // Elf warm-white — light section bg
        ink: "#2C2C2A", // Elf ink — dark text on light
        body: "#586860", // muted green-grey text on light
        fog: "#9FB4AB", // muted text on dark
        // Elf forest-green family
        green: { DEFAULT: "#1D9E75", deep: "#0F6E56", forest: "#0F3D2B", bright: "#6BC9A2" },
        mint: "#9FE1CB",
        sun: "#FEE75C",
        rose: "#EB459E",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: { "4xl": "2rem", "5xl": "2.75rem" },
      boxShadow: {
        pop: "0 18px 40px -12px rgba(34, 38, 56, 0.28)",
        chunk: "0 8px 0 0 rgba(71, 82, 196, 0.9)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-16px)" },
        },
      },
      animation: { float: "float 7s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
