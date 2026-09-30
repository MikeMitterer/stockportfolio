import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'

/**
 * Browser- und Test-Globals.
 * `no-undef` kennt sie sonst nicht und meldet sie als undefiniert.
 */
const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  indexedDB: 'readonly',
  crypto: 'readonly',
  fetch: 'readonly',
  Response: 'readonly',
  Request: 'readonly',
  Headers: 'readonly',
  URL: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  queueMicrotask: 'readonly',
  structuredClone: 'readonly',
  HTMLElement: 'readonly',
  Element: 'readonly',
  Event: 'readonly',
}

export default [
  {
    // public/ wird unverändert ausgeliefert und nicht übersetzt — config.js
    // ist bewusst eine schlichte Browser-Datei ohne Modul-Kontext.
    ignores: ['dist/**', 'node_modules/**', '.vite/**', 'coverage/**', 'public/**'],
  },
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      globals: browserGlobals,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Die Basis-Regeln verstehen TypeScript-Konstrukte nicht (Typ-Deklarationen
      // in defineEmits, Interface-Signaturen) und melden dort Fehlalarme.
      // Die TS-Varianten kennen sie und übernehmen die Prüfung.
      'no-unused-vars': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-self-closing': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/attributes-order': 'off',
    },
  },
  {
    /*
     * Keine sichtbaren Texte direkt im Template.
     *
     * Die App war von Anfang an auf vue-i18n ausgelegt — trotzdem ist in jede
     * neu hinzugekommene Komponente wieder deutscher Text gewandert, und beim
     * Nachrüsten der zweiten Sprache musste alles einzeln herausgesucht
     * werden. Diese Regel macht daraus einen Fehler statt einer Fleißaufgabe.
     *
     * `allowlist` deckt ab, was keine Sprache hat: Satzzeichen, Einheiten,
     * Währungszeichen.
     */
    files: ['src/**/*.vue'],
    rules: {
      'vue/no-bare-strings-in-template': [
        'error',
        {
          allowlist: [
            '(', ')', ',', '.', '·', '—', '–', '-', '/', '|', '×', '&nbsp;',
            ':', ';', '!', '?', '%', '€', '$', '+', '±', '↗', '→', '…',
            // Eigennamen und Code-Platzhalter — die übersetzt niemand.
            'StockPortfolio', 'MangoLila', 'ISIN', 'TER', 'ETF', 'Symbol',
            '{isin}', '{symbol}', 'Δ',
          ],
        },
      ],
    },
  },
]
