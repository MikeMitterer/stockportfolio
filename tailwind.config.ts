import type { Config } from 'tailwindcss'

/**
 * Tailwind läuft parallel zu Naive UI:
 * - Naive liefert Komponenten (Table, Card, Modal, Form, …) und deren Theme
 * - Tailwind übernimmt Layout und Utility-Klassen
 *
 * `preflight` ist **aktiv**. Es war zunächst abgeschaltet, um Naive UI nicht
 * zu stören — das hat aber die Browser-Vorgaben durchgelassen und drei
 * getrennte Fehler verursacht: grauer Hintergrund auf jedem `<button>`,
 * unterstrichene Navigations-Links, eingelassener Rahmen auf jedem `<input>`,
 * der zudem die Spaltenbreite sprengte. Jede Rücknahme von Hand fing nur das
 * jeweils bemerkte Symptom.
 *
 * Naive UI setzt seine Farben und Rahmen über Klassen, die Preflights
 * Element-Selektoren in der Spezifität schlagen.
 *
 * Die Farben verweisen auf die Theme-Token (`theme/tokens.css`), die als
 * RGB-Tripel vorliegen — nur so greifen Deckkraft-Zusätze wie `bg-card/70`.
 * Dadurch
 * gilt `bg-card` in jedem Theme — feste Werte wie `bg-neutral-900` wären
 * beim Theme-Wechsel stehen geblieben.
 */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'rgb(var(--surface-page) / <alpha-value>)',
        card: 'rgb(var(--surface-card) / <alpha-value>)',
        raised: 'rgb(var(--surface-raised) / <alpha-value>)',
        sunken: 'rgb(var(--surface-sunken) / <alpha-value>)',

        ink: {
          DEFAULT: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },

        edge: {
          DEFAULT: 'rgb(var(--border-default) / <alpha-value>)',
          subtle: 'rgb(var(--border-subtle) / <alpha-value>)',
        },

        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          contrast: 'rgb(var(--accent-contrast) / <alpha-value>)',
        },

        asset: {
          stocks: 'rgb(var(--asset-stocks) / <alpha-value>)',
          bonds: 'rgb(var(--asset-bonds) / <alpha-value>)',
          metals: 'rgb(var(--asset-metals) / <alpha-value>)',
          moneymarket: 'rgb(var(--asset-moneymarket) / <alpha-value>)',
          cash: 'rgb(var(--asset-cash) / <alpha-value>)',
        },

        status: {
          ok: 'rgb(var(--status-ok) / <alpha-value>)',
          near: 'rgb(var(--status-near) / <alpha-value>)',
          out: 'rgb(var(--status-out) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config
