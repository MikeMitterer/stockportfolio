/**
 * Die verfügbaren Themes.
 *
 * Namen an die MakeLib-Konvention (`MAKE_THEME`) angelehnt, damit Terminal
 * und App dieselbe Sprache sprechen. Wie dort hat ein Theme keine
 * Helligkeitsachse — es ist ein fertiges Gesamtbild.
 */

export const THEME_IDS = ['mangolila', 'classic', 'ocean', 'forest', 'paper', 'mono'] as const

export type ThemeId = (typeof THEME_IDS)[number]

export interface ThemeInfo {
  id: ThemeId
  label: string
  /** Steuert, ob Naive UI seine helle oder dunkle Grundvariante nimmt. */
  isDark: boolean
  /** Kurzbeschreibung für die Auswahl. */
  hint: string
}

export const THEMES: Record<ThemeId, ThemeInfo> = {
  classic: { id: 'classic', label: 'Classic', isDark: true, hint: 'Dunkel, neutralgrau' },
  ocean: { id: 'ocean', label: 'Ocean', isDark: true, hint: 'Dunkel, blaustichig' },
  forest: { id: 'forest', label: 'Forest', isDark: true, hint: 'Dunkel, grünstichig' },
  mangolila: {
    id: 'mangolila',
    label: 'MangoLila',
    isDark: true,
    hint: 'Wie das StockInfo-Backend — Pflaume mit Koralle',
  },
  paper: { id: 'paper', label: 'Paper', isDark: false, hint: 'Hell, warmes Off-White' },
  mono: { id: 'mono', label: 'Mono', isDark: false, hint: 'Hell, nahezu farblos' },
}

export const DEFAULT_THEME: ThemeId = 'mangolila'

/** Prüft, ob ein beliebiger Wert eine gültige Theme-Kennung ist. */
export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value)
}
