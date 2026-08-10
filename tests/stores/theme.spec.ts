/**
 * Tests für die Theme-Vorgabe.
 *
 * Der Punkt: Ohne eigene Wahl soll die Systemeinstellung entscheiden — wer
 * sein System hell betreibt, wird sonst von einer dunklen Oberfläche begrüßt.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readStoredTheme, systemTheme } from '@/stores/theme'

const STORAGE_KEY = 'stockportfolio.theme'

/**
 * Ersatz für den localStorage.
 *
 * Die jsdom-Umgebung dieses Projekts bringt keinen mit — `window.localStorage`
 * ist dort schlicht `undefined`.
 */
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

/** Stellt `matchMedia` so, als sei das System hell oder dunkel eingestellt. */
function pretendSystem(dark: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({ matches: dark && query.includes('dark') }) as MediaQueryList,
  )
}

beforeEach(() => {
  storage = fakeStorage()
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('systemTheme', () => {
  it('wählt bei dunklem System MangoLila', () => {
    pretendSystem(true)
    expect(systemTheme()).toBe('mangolila')
  })

  it('wählt bei hellem System Paper', () => {
    pretendSystem(false)
    expect(systemTheme()).toBe('paper')
  })
})

describe('readStoredTheme', () => {
  it('folgt ohne gespeicherte Wahl dem System', () => {
    pretendSystem(false)
    expect(readStoredTheme()).toBe('paper')
  })

  it('lässt die eigene Wahl das System überstimmen', () => {
    // Einmal gewählt, bleibt gewählt — auch wenn das System später wechselt.
    pretendSystem(false)
    storage.setItem(STORAGE_KEY, 'forest')
    expect(readStoredTheme()).toBe('forest')
  })

  it('ignoriert eine unbekannte Kennung und fragt wieder das System', () => {
    pretendSystem(true)
    storage.setItem(STORAGE_KEY, 'gibt-es-nicht')
    expect(readStoredTheme()).toBe('mangolila')
  })

  it('übersetzt die alten Werte des Hell/Dunkel-Schalters', () => {
    pretendSystem(true)
    storage.setItem(STORAGE_KEY, 'light')
    expect(readStoredTheme()).toBe('paper')

    storage.setItem(STORAGE_KEY, 'dark')
    expect(readStoredTheme()).toBe('mangolila')
  })
})
