/**
 * Unit-Tests für die Auflösung der API-Adresse.
 *
 * Fokus: die Reihenfolge der Quellen und der Abbruch ohne Adresse. Die
 * Adresse ist Pflicht — eine eingebaute Rückfallebene wäre für jeden außer
 * ihrem Besitzer ein Name, der nicht auflöst, und der Fehler zeigte sich erst
 * als leere Kurstabelle.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiBaseUrl, MissingApiUrlError } from '@/api/client'

/** Laufzeit-Konfiguration setzen, wie sie der Container-Entrypoint schreibt. */
function setRuntimeUrl(apiUrl: string | undefined): void {
  if (apiUrl === undefined) {
    delete (globalThis.window as { __STOCKPORTFOLIO_CONFIG__?: unknown }).__STOCKPORTFOLIO_CONFIG__
    return
  }
  ;(globalThis.window as { __STOCKPORTFOLIO_CONFIG__?: unknown }).__STOCKPORTFOLIO_CONFIG__ = {
    apiUrl,
  }
}

afterEach(() => {
  setRuntimeUrl(undefined)
  vi.unstubAllEnvs()
})

describe('apiBaseUrl', () => {
  it('nimmt die Adresse aus der Laufzeit-Konfiguration', () => {
    vi.stubEnv('VITE_STOCKINFO_API_URL', 'https://aus-dem-build.example.com')
    setRuntimeUrl('https://zur-laufzeit.example.com')

    expect(apiBaseUrl()).toBe('https://zur-laufzeit.example.com')
  })

  it('fällt auf den Wert aus dem Build zurück', () => {
    vi.stubEnv('VITE_STOCKINFO_API_URL', 'https://aus-dem-build.example.com')

    expect(apiBaseUrl()).toBe('https://aus-dem-build.example.com')
  })

  it('übergeht eine leere Laufzeit-Angabe', () => {
    // Der Entrypoint schreibt die Datei auch ohne gesetzte Variable — dann
    // steht dort eine leere Zeichenkette, keine fehlende Eigenschaft.
    vi.stubEnv('VITE_STOCKINFO_API_URL', 'https://aus-dem-build.example.com')
    setRuntimeUrl('   ')

    expect(apiBaseUrl()).toBe('https://aus-dem-build.example.com')
  })

  it('bricht ab, wenn keine Quelle etwas liefert', () => {
    vi.stubEnv('VITE_STOCKINFO_API_URL', '')

    expect(() => apiBaseUrl()).toThrow(MissingApiUrlError)
  })
})
