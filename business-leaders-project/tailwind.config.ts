import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      colors: {
        library: {
          bg: "var(--bg)",
          bg0: "var(--bg0)",
          bg1: "var(--bg1)",
          surface: "var(--surface)",
          "surface-2": "var(--surface-2)",
          tan: "var(--tan)",
          parchment: "var(--parchment)",
          brass: "var(--brass)",
          text: "var(--text)",
          muted: "var(--text-muted)",
          border: "var(--border)",
          "border-hover": "var(--border-hover)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
