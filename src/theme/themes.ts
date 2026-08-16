/**
 * Die verfügbaren Themes.
 *
 * Namen an die MakeLib-Konvention (`MAKE_THEME`) angelehnt, damit Terminal
 * und App dieselbe Sprache sprechen. Wie dort hat ein Theme keine
 * Helligkeitsachse — es ist ein fertiges Gesamtbild.
 */

export const THEME_IDS = [
  'mangolila',
  'amber',
  'petrol',
  'classic',
  'slate',
  'ocean',
  'forest',
  'aurora',
  'carbon',
  'paper',
  'sepia',
  'meadow',
  'mono',
] as const

export type ThemeId = (typeof THEME_IDS)[number]

/**
 * Ein Theme.
 *
 * Name und Beschreibung stehen im Message-Katalog, nicht hier: Sie sind
 * sichtbarer Text und gehören damit zur Sprache, nicht zur Farbdefinition.
 */
export interface ThemeInfo {
  id: ThemeId
  /** Steuert, ob Naive UI seine helle oder dunkle Grundvariante nimmt. */
  isDark: boolean
  /**
   * Vorschaufarben für die Auswahl.
   *
   * Bewusst fest notiert statt aus den CSS-Variablen gelesen: Die Tokens
   * eines *nicht aktiven* Themes stehen im Dokument nicht zur Verfügung —
   * ohne diese Kopie ließe sich nur das gerade laufende Theme zeigen.
   * Werte gespiegelt aus `tokens.css`.
   */
  preview: { page: string; card: string; ink: string; accent: string }
}

export const THEMES: Record<ThemeId, ThemeInfo> = {
  classic: {
    id: 'classic',
    isDark: true,
    preview: { page: '#0a0a0a', card: '#171717', ink: '#f5f5f5', accent: '#3987e5' },
  },
  slate: {
    id: 'slate',
    isDark: true,
    preview: { page: '#181c23', card: '#20262f', ink: '#e9edf3', accent: '#60a5fa' },
  },
  ocean: {
    id: 'ocean',
    isDark: true,
    preview: { page: '#061320', card: '#0c2036', ink: '#eef4fa', accent: '#38b2d8' },
  },
  forest: {
    id: 'forest',
    isDark: true,
    preview: { page: '#061409', card: '#0c2313', ink: '#eef6f0', accent: '#4caf72' },
  },
  mangolila: {
    id: 'mangolila',
    isDark: true,
    preview: { page: '#181716', card: '#23211f', ink: '#f8f5f2', accent: '#e55e1f' },
  },

  amber: {
    id: 'amber',
    isDark: true,
    preview: { page: '#181411', card: '#241e19', ink: '#f8f5f2', accent: '#c45ed4' },
  },
  petrol: {
    id: 'petrol',
    isDark: true,
    preview: { page: '#0f191a', card: '#172526', ink: '#f2f8f8', accent: '#e56124' },
  },

  aurora: {
    id: 'aurora',
    isDark: true,
    preview: { page: '#0d0c18', card: '#161426', ink: '#f0eefa', accent: '#a78bfa' },
  },
  carbon: {
    id: 'carbon',
    isDark: true,
    preview: { page: '#080809', card: '#111113', ink: '#fcfcfd', accent: '#38bdf8' },
  },
  paper: {
    id: 'paper',
    isDark: false,
    preview: { page: '#efe7d8', card: '#fbf7ef', ink: '#1c1a16', accent: '#2a78d6' },
  },
  sepia: {
    id: 'sepia',
    isDark: false,
    preview: { page: '#f4eee2', card: '#fcf8f0', ink: '#262119', accent: '#b45309' },
  },
  meadow: {
    id: 'meadow',
    isDark: false,
    preview: { page: '#eef3ee', card: '#fafcf9', ink: '#1a261e', accent: '#15803d' },
  },
  mono: {
    id: 'mono',
    isDark: false,
    preview: { page: '#efefef', card: '#f7f7f7', ink: '#171717', accent: '#404040' },
  },
}

/**
 * Vorgabe, solange der Nutzer nichts gewählt hat.
 *
 * Zwei statt einer: Welche gilt, entscheidet die Systemeinstellung — siehe
 * `systemTheme()` im Theme-Store.
 */
export const DEFAULT_DARK_THEME: ThemeId = 'mangolila'
export const DEFAULT_LIGHT_THEME: ThemeId = 'paper'

/** Prüft, ob ein beliebiger Wert eine gültige Theme-Kennung ist. */
export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value)
}
