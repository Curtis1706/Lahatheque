/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Mappage dynamique des couleurs
        background: {
          DEFAULT: "var(--background)",
          secondary: "var(--background-secondary)",
        },
        border: "var(--border)",
        foreground: {
          DEFAULT: "var(--foreground)",
          muted: "var(--foreground-muted)",
        },
        navy: {
          DEFAULT: "var(--navy)",
          hover: "var(--navy-hover)",
          dark: "var(--navy-dark)",
          light: "var(--navy-light)",
        },
        primary: {
          DEFAULT: "var(--navy)",
          hover: "var(--navy-hover)",
          dark: "var(--navy-dark)",
          light: "var(--navy-light)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          light: "var(--gold-light)",
          dark: "var(--gold-dark)",
        },
        secondary: {
          DEFAULT: "var(--gold)",
          light: "var(--gold-light)",
          dark: "var(--gold-dark)",
        },
        success: {
          DEFAULT: "var(--success)",
        },
        error: {
          DEFAULT: "var(--error)",
        },
        warning: {
          DEFAULT: "var(--warning)",
        },
        info: {
          DEFAULT: "var(--info)",
        },
      },
    },
  },
  plugins: [],
};
