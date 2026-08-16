/**
 * Pinia-Store für die Sprache.
 *
 * Wie beim Theme in localStorage statt IndexedDB: Die Wahl muss beim
 * allerersten Bildaufbau feststehen. Käme sie aus der Datenbank, stünde für
 * einen Moment die falsche Sprache auf dem Bildschirm.
 */

import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { detectLocale, persistLocale } from '@mikemitterer/ux-foundation'
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

/**
 * Vorgabe, wenn keine der Browsersprachen einen Katalog hat.
 *
 * Englisch statt Deutsch: Wer Französisch oder Italienisch eingestellt hat,
 * kommt mit Englisch eher zurecht — und es ist die Vorgabe der App.
 */
export const DEFAULT_LOCALE: LocaleId = 'en'

/**
 * Liest die gespeicherte Wahl, sonst die des Browsers.
 *
 * Die Reihenfolge und die Abbildung `de-AT` → `de` liegen im Fundament: Das
 * ist in jeder App dieselbe Logik und genau die Sorte, die beim Nachbauen
 * unbemerkt falsch wird — die frühere Fassung hier las nur die erste
 * Browsersprache und übersah ein Deutsch an zweiter Stelle.
 */
export function readStoredLocale(): LocaleId {
  return detectLocale(LOCALE_IDS, DEFAULT_LOCALE, STORAGE_KEY)
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
    // Schreibt die Wahl und zieht `lang` am Wurzelelement nach — ohne das
    // trennt der Browser Wörter nach den Regeln der falschen Sprache.
    persistLocale(next, STORAGE_KEY)
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
