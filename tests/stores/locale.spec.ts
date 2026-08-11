/**
 * Tests für die Sprachwahl.
 *
 * Der Punkt: Texte, Zahlen und Datumsangaben müssen zusammen umschalten. Sie
 * getrennt zu behandeln ist der übliche Fehler — die Beschriftung wäre
 * englisch und die Zahl darunter im deutschen Format.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  browserLocale,
  DEFAULT_LOCALE,
  isLocaleId,
  readStoredLocale,
  useLocaleStore,
} from '@/stores/locale'
import { eur, setFormatterLocale } from '@/domain/formatters'
import { i18n } from '@/i18n'

const STORAGE_KEY = 'stockportfolio.locale'

/** Ersatz für den localStorage — die jsdom-Umgebung bringt keinen mit. */
function fakeStorage(): Storage {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size
    },
  } as Storage
}

let storage: Storage

beforeEach(() => {
  setActivePinia(createPinia())
  storage = fakeStorage()
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
  i18n.global.locale.value = 'en'
  setFormatterLocale('en-GB')
})

describe('isLocaleId', () => {
  it('erkennt die bekannten Sprachen', () => {
    expect(isLocaleId('de')).toBe(true)
    expect(isLocaleId('en')).toBe(true)
    expect(isLocaleId('fr')).toBe(false)
  })
})

describe('browserLocale', () => {
  it('nimmt Deutsch bei deutschem Browser', () => {
    vi.stubGlobal('navigator', { languages: ['de-AT'], language: 'de-AT' })
    expect(browserLocale()).toBe('de')
  })

  it('behandelt regionale Varianten wie ihre Hauptsprache', () => {
    // de-CH und de-AT sind beide Deutsch; eigene Kataloge dafür wären Unsinn.
    vi.stubGlobal('navigator', { languages: ['de-CH'], language: 'de-CH' })
    expect(browserLocale()).toBe('de')
  })

  it('gibt allem anderen die Vorgabe', () => {
    // Auch Sprachen ohne Katalog — Englisch ist die wahrscheinlichere
    // Zweitsprache als Deutsch.
    vi.stubGlobal('navigator', { languages: ['fr-FR'], language: 'fr-FR' })
    expect(browserLocale()).toBe(DEFAULT_LOCALE)
    expect(DEFAULT_LOCALE).toBe('en')
  })
})

describe('readStoredLocale', () => {
  it('nimmt die eigene Wahl', () => {
    storage.setItem(STORAGE_KEY, 'de')

    expect(readStoredLocale()).toBe('de')
  })

  it('folgt ohne eigene Wahl dem Browser', () => {
    vi.stubGlobal('navigator', { languages: ['de-AT'], language: 'de-AT' })

    expect(readStoredLocale()).toBe('de')
  })

  it('lässt die eigene Wahl den Browser überstimmen', () => {
    // Einmal gewählt, bleibt gewählt — sonst wäre der Umschalter wertlos.
    vi.stubGlobal('navigator', { languages: ['de-AT'], language: 'de-AT' })
    storage.setItem(STORAGE_KEY, 'en')

    expect(readStoredLocale()).toBe('en')
  })

  it('ignoriert eine unbekannte Kennung', () => {
    storage.setItem(STORAGE_KEY, 'klingonisch')

    expect(readStoredLocale()).toBe('en')
  })
})

describe('useLocaleStore', () => {
  it('schaltet die Texte um', () => {
    const store = useLocaleStore()

    store.setLocale('en')

    expect(i18n.global.locale.value).toBe('en')
    expect(i18n.global.t('nav.settings')).toBe('Settings')
  })

  it('schaltet das Zahlenformat mit um', () => {
    // Der Kern: „1.234 €" auf Deutsch, „€1,234" auf Englisch — Beschriftung
    // und Zahl dürfen nicht auseinanderfallen.
    const store = useLocaleStore()

    store.setLocale('de')
    const german = eur(1234)
    store.setLocale('en')
    const english = eur(1234)

    expect(german).not.toBe(english)
    expect(german).toContain('.')
  })

  it('merkt sich die Wahl', () => {
    const store = useLocaleStore()

    store.setLocale('en')

    expect(storage.getItem(STORAGE_KEY)).toBe('en')
  })

  it('setzt die Sprache am Dokument — für Vorlesewerkzeuge und Silbentrennung', () => {
    const store = useLocaleStore()

    store.setLocale('en')

    expect(document.documentElement.lang).toBe('en')
  })

  it('übernimmt beim Start die gespeicherte Wahl', () => {
    storage.setItem(STORAGE_KEY, 'en')
    const store = useLocaleStore()

    store.init()

    expect(store.current).toBe('en')
  })
})
