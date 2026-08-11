/**
 * Pinia-Store für die Sprache.
 *
 * Wie beim Theme in localStorage statt IndexedDB: Die Wahl muss beim
 * allerersten Bildaufbau feststehen. Käme sie aus der Datenbank, stünde für
 * einen Moment die falsche Sprache auf dem Bildschirm.
 */

import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { i18n } from '@/i18n'
import { setFormatterLocale } from '@/domain/formatters'

const STORAGE_KEY = 'stockportfolio.locale'

export const LOCALE_IDS = ['de', 'en'] as const
export type LocaleId = (typeof LOCALE_IDS)[number]

export interface LocaleInfo {
  id: LocaleId
  label: string
  /**
   * Kennung fürs Zahlen- und Datumsformat.
   *
   * Österreichisch statt bundesdeutsch: Die App entsteht hier, und der
   * Unterschied ist bei Datumsangaben sichtbar. Für Englisch `en-GB` — ein
   * Datum als 08/11/2026 ist für alle außer den USA eine Falle.
   */
  numberLocale: string
}

export const LOCALES: Record<LocaleId, LocaleInfo> = {
  de: { id: 'de', label: 'Deutsch', numberLocale: 'de-AT' },
  en: { id: 'en', label: 'English', numberLocale: 'en-GB' },
}

/** Prüft, ob ein beliebiger Wert eine bekannte Sprache ist. */
export function isLocaleId(value: unknown): value is LocaleId {
  return typeof value === 'string' && (LOCALE_IDS as readonly string[]).includes(value)
}

/** Vorgabe, wenn die Browsersprache keinen Katalog hat. */
export const DEFAULT_LOCALE: LocaleId = 'en'

/**
 * Sprache des Browsers, auf die bekannten abgebildet.
 *
 * Nur der erste Teil zählt: `de-CH` und `de-AT` sind beide Deutsch, und wer
 * die Unterschiede abbilden wollte, bräuchte Katalog um Katalog. Alles andere
 * — Französisch, Italienisch — bekommt Englisch: Es ist die Vorgabe der App
 * und die wahrscheinlichere Zweitsprache.
 */
export function browserLocale(): LocaleId {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const preferred = navigator.languages?.[0] ?? navigator.language ?? ''
  return preferred.toLowerCase().startsWith('de') ? 'de' : DEFAULT_LOCALE
}

/** Liest die gespeicherte Wahl, sonst die des Browsers. */
export function readStoredLocale(): LocaleId {
  try {
    const stored = window.localStorage?.getItem(STORAGE_KEY)
    if (isLocaleId(stored)) return stored
  } catch {
    // Privater Modus: dann eben die des Browsers.
  }
  return browserLocale()
}

export const useLocaleStore = defineStore('locale', () => {
  const current = ref<LocaleId>(DEFAULT_LOCALE)

  const info = computed(() => LOCALES[current.value])

  /** Übernimmt die gespeicherte Sprache; beim Start aufzurufen. */
  function init(): void {
    setLocale(readStoredLocale())
  }

  /**
   * Stellt die Sprache um — Texte, Zahlen und Datumsangaben zusammen.
   *
   * Die drei getrennt zu behandeln wäre der übliche Fehler: Die Beschriftung
   * wäre englisch und die Zahl darunter im deutschen Format.
   */
  function setLocale(next: LocaleId): void {
    current.value = next
    i18n.global.locale.value = next
    setFormatterLocale(LOCALES[next].numberLocale)
    document.documentElement.lang = next

    try {
      window.localStorage?.setItem(STORAGE_KEY, next)
    } catch {
      // Dann eben nur für diese Sitzung.
    }
  }

  return { current, info, init, setLocale }
})

/*
 * Hot-Reload: Ohne diese Zeile behält der Browser beim Speichern die alte
 * Fassung des Stores. Neue Methoden fehlen dann — der Aufruf läuft ins Leere
 * und man sucht den Fehler im eigenen Code, obwohl nur ein Neuladen fehlt.
 */
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLocaleStore, import.meta.hot))
}
