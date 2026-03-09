import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        text: "#1a1a1a",
        border: "#e5e5e5",
        code: "#f5f5f5",
      },
      maxWidth: {
        prose: "65ch",
        content: "680px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
