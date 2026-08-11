/**
 * Pinia-Store für das aktive Theme.
 *
 * Bewusst in localStorage statt IndexedDB: die Wahl muss beim allerersten
 * Bildaufbau feststehen, bevor asynchrone Datenbankzugriffe zurückkommen —
 * sonst blitzt kurz das falsche Theme auf.
 */

import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  isThemeId,
  THEMES,
  type ThemeId,
} from '@/theme/themes'

const STORAGE_KEY = 'stockportfolio.theme'

/**
 * Zugriff auf den localStorage, der auch ohne ihn auskommt.
 *
 * Im privaten Modus mancher Browser und bei blockierten Cookies wirft schon
 * der bloße Zugriff. Das Theme ist eine Bequemlichkeit — dafür soll die App
 * nicht beim Start stehen bleiben.
 */
function readStorage(key: string): string | null {
  try {
    return window.localStorage?.getItem(key) ?? null
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage?.setItem(key, value)
  } catch {
    // Dann eben nur für diese Sitzung.
  }
}

/**
 * Fragt das Betriebssystem, ob es dunkel eingestellt ist.
 *
 * Ältere Umgebungen und die Testumgebung kennen `matchMedia` nicht — dort
 * gilt dunkel, weil die App überwiegend dunkle Themes mitbringt.
 */
export function prefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Vorgabe für den allerersten Start — richtet sich nach dem System. */
export function systemTheme(): ThemeId {
  return prefersDark() ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME
}

/**
 * Liest das gespeicherte Theme.
 *
 * Ohne gespeicherte Wahl entscheidet die Systemeinstellung: Wer sein System
 * hell betreibt, soll nicht von einer dunklen Oberfläche begrüßt werden. Die
 * Wahl greift nur beim ersten Mal — ab der ersten eigenen Auswahl gilt diese,
 * auch wenn das System später wechselt.
 *
 * Übersetzt außerdem die alten Werte des früheren Hell/Dunkel-Schalters, damit
 * niemand nach dem Update vor einer unerwarteten Oberfläche sitzt.
 */
export function readStoredTheme(): ThemeId {
  const stored = readStorage(STORAGE_KEY)
  if (isThemeId(stored)) return stored
  if (stored === 'dark') return DEFAULT_DARK_THEME
  if (stored === 'light') return DEFAULT_LIGHT_THEME
  return systemTheme()
}

/** Setzt das Theme am Wurzelelement — die Tokens hängen an `data-theme`. */
export function applyTheme(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme
  // Naive UI und Formularelemente richten sich nach `color-scheme`.
  document.documentElement.style.colorScheme = THEMES[theme].isDark ? 'dark' : 'light'
}

export const useThemeStore = defineStore('theme', () => {
  const current = ref<ThemeId>(systemTheme())

  const info = computed(() => THEMES[current.value])
  const isDark = computed(() => info.value.isDark)

  /** Übernimmt das gespeicherte Theme; beim Start aufzurufen. */
  function init(): void {
    setTheme(readStoredTheme())
  }

  function setTheme(theme: ThemeId): void {
    current.value = theme
    applyTheme(theme)
    writeStorage(STORAGE_KEY, theme)
  }

  return { current, info, isDark, init, setTheme }
})

/*
 * Hot-Reload: Ohne diese Zeile behält der Browser beim Speichern die alte
 * Fassung des Stores. Neue Methoden fehlen dann — der Aufruf läuft ins Leere
 * und man sucht den Fehler im eigenen Code, obwohl nur ein Neuladen fehlt.
 */
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useThemeStore, import.meta.hot))
}
