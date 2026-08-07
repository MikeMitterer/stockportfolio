import type { Config } from 'tailwindcss'

/**
 * Tailwind läuft parallel zu Naive UI:
 * - Naive liefert Komponenten (Table, Card, Modal, Form, ...) und deren Theme
 * - Tailwind übernimmt Layout und Utility-Klassen (flex, gap, padding, ...)
 *
 * `preflight` ist deaktiviert, damit Tailwind Naive-UI-Defaults nicht überschreibt.
 */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  darkMode: 'class',
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
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
