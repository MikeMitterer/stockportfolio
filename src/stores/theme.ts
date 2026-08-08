/**
 * Pinia-Store für das aktive Theme.
 *
 * Bewusst in localStorage statt IndexedDB: die Wahl muss beim allerersten
 * Bildaufbau feststehen, bevor asynchrone Datenbankzugriffe zurückkommen —
 * sonst blitzt kurz das falsche Theme auf.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { DEFAULT_THEME, isThemeId, THEMES, type ThemeId } from '@/theme/themes'

const STORAGE_KEY = 'stockportfolio.theme'

/**
 * Liest das gespeicherte Theme.
 *
 * Übersetzt dabei die alten Werte des früheren Hell/Dunkel-Schalters, damit
 * niemand nach dem Update vor einer unerwarteten Oberfläche sitzt.
 */
export function readStoredTheme(): ThemeId {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (isThemeId(stored)) return stored
  if (stored === 'dark') return 'classic'
  if (stored === 'light') return 'paper'
  return DEFAULT_THEME
}

/** Setzt das Theme am Wurzelelement — die Tokens hängen an `data-theme`. */
export function applyTheme(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme
  // Naive UI und Formularelemente richten sich nach `color-scheme`.
  document.documentElement.style.colorScheme = THEMES[theme].isDark ? 'dark' : 'light'
}

export const useThemeStore = defineStore('theme', () => {
  const current = ref<ThemeId>(DEFAULT_THEME)

  const info = computed(() => THEMES[current.value])
  const isDark = computed(() => info.value.isDark)

  /** Übernimmt das gespeicherte Theme; beim Start aufzurufen. */
  function init(): void {
    setTheme(readStoredTheme())
  }

  function setTheme(theme: ThemeId): void {
    current.value = theme
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }

  return { current, info, isDark, init, setTheme }
})
