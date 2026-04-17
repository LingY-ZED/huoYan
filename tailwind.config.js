import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--color-brand)",
          light: "var(--color-brand-light)",
          accent: "var(--color-brand-accent)",
        },
        ui: {
          bg: "var(--color-ui-bg)",
          border: "var(--color-ui-border)",
          card: "var(--color-ui-card)",
        },
        navy: {
          950: "var(--color-brand)",
          900: "var(--color-brand-light)",
        },
        serious: "var(--color-serious)",
        alert: "var(--color-alert)",
        safe: "var(--color-safe)",
        key: "var(--color-key)",
        info: "var(--color-info)",
        fund: "var(--color-fund)",
        surface: "var(--color-surface)",
        ground: "var(--color-ground)",
        border: "var(--color-border)",
        "border-light": "var(--color-border-light)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        "text-inverse": "var(--color-text-inverse)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.05)",
        "card-hover": "0 4px 12px rgba(26,58,92,0.12)",
        panel: "0 4px 12px rgba(26,58,92,0.08)",
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [forms],
};
