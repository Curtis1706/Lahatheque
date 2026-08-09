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
          200: "var(--ds-background-200)",
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
        gray: {
          200: "var(--ds-gray-200)",
          1000: "var(--ds-gray-1000)",
          "alpha-400": "var(--ds-gray-alpha-400)",
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
      boxShadow: {
        book: "var(--ds-shadow-book)",
        "book-border": "var(--ds-shadow-book-border)",
      },
    },
  },
  plugins: [],
};
