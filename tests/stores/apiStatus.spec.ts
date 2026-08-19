/**
 * Tests für den API-Status.
 *
 * Der Grund für die Seite: Ohne die Gegenstelle gibt es keine Kurse und damit
 * keine einzige Kennzahl. Wenn etwas nicht geht, muss die Seite sagen, *was*
 * — „nicht erreichbar" allein hilft niemandem weiter.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useApiStatusStore } from '@/stores/apiStatus'
import { StockInfoClient } from '@/api/client'
import { ApiError } from '@/api/errors'
import { i18n } from '@/i18n'

/** Client, dessen `/health` antwortet wie vorgegeben. */
function clientWith(response: () => Promise<unknown>): StockInfoClient {
  const client = new StockInfoClient('https://example.test')
  vi.spyOn(client, 'health').mockImplementation(response as never)
  return client
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useApiStatusStore', () => {
  it('startet ungeprüft', () => {
    const status = useApiStatusStore()

    expect(status.state).toBe('unknown')
    expect(status.checkedAt).toBeNull()
  })

  it('übernimmt Status und Version einer gesunden API', async () => {
    const client = clientWith(async () => ({ status: 'ok', version: '2.3.1' }))
    const status = useApiStatusStore()
    await status.check(client)

    expect(status.state).toBe('online')
    expect(status.status).toBe('ok')
    expect(status.version).toBe('2.3.1')
    expect(status.error).toBeNull()
  })

  it('hält den Zeitpunkt der Prüfung fest', async () => {
    const client = clientWith(async () => ({ status: 'ok', version: '1.0' }))
    const status = useApiStatusStore()
    await status.check(client)

    expect(status.checkedAt).not.toBeNull()
  })

  it('misst die Antwortzeit', async () => {
    const client = clientWith(async () => ({ status: 'ok', version: '1.0' }))
    const status = useApiStatusStore()
    await status.check(client)

    expect(status.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('meldet den Grund, wenn die API einen Fehler liefert', async () => {
    const client = clientWith(async () => {
      throw new ApiError(503, 'Service Unavailable', 'https://example.test/health')
    })
    const status = useApiStatusStore()
    await status.check(client)

    expect(status.state).toBe('offline')
    expect(status.error).toContain('Service Unavailable')
    expect(status.error).toContain('503')
  })

  it('nennt bei ausbleibender Antwort die Adresse — dort liegt meist die Ursache', async () => {
    // Status 0 heißt: gar keine Antwort. Netz, falsche Adresse oder CORS.
    const client = clientWith(async () => {
      throw new ApiError(0, 'Netzwerkfehler', 'https://example.test/health')
    })
    const status = useApiStatusStore()
    await status.check(client)

    expect(status.error).toContain('https://example.test/health')
  })

  it('verwirft alte Werte, wenn die Prüfung fehlschlägt', async () => {
    // Sonst stünde eine Version auf der Seite, die gerade niemand bestätigt.
    let healthy = true
    const client = clientWith(async () => {
      if (healthy) return { status: 'ok', version: '2.3.1' }
      throw new ApiError(0, 'weg', 'https://example.test/health')
    })
    const status = useApiStatusStore()

    await status.check(client)
    expect(status.version).toBe('2.3.1')

    healthy = false
    await status.check(client)
    expect(status.version).toBeNull()
    expect(status.status).toBeNull()
  })

  it('kommt ohne Client zurecht, statt zu werfen', async () => {
    const status = useApiStatusStore()
    await status.check(null)

    expect(status.state).toBe('offline')
    // Über den Katalog, nicht über den deutschen Satz: Die Vorgabesprache ist
    // Englisch, und ein Test darf nicht an einer Sprache kleben.
    expect(status.error).toBe(i18n.global.t('notify.noClient'))
  })

  it('gibt die konfigurierte Adresse unverändert zurück', () => {
    // Sie stammt aus dem .env-File und ist im Container die einzige Stelle,
    // an der sich das angesprochene Backend ablesen lässt.
    expect(new StockInfoClient('https://stockinfo.example/').url).toBe('https://stockinfo.example')
  })
})

/**
 * Erst fragen, dann laden.
 *
 * Health-Check und Kursabruf liefen gleichzeitig los: Wenn die Ansichten
 * luden, wusste noch niemand, dass der Dienst tot ist — also gingen acht
 * Abrufe in ihre Zeitüberschreitung, und hinterher meldete die App „8 Kurse
 * fehlen". Beides für eine Ursache, die vorher feststand.
 */
describe('useApiStatusStore — ensureChecked', () => {
  it('prüft genau einmal, auch bei mehreren Aufrufen', async () => {
    const client = clientWith(async () => ({ status: 'ok', version: '1.0' }))
    const store = useApiStatusStore()

    await Promise.all([
      store.ensureChecked(client),
      store.ensureChecked(client),
      store.ensureChecked(client),
    ])

    expect(client.health).toHaveBeenCalledTimes(1)
  })

  it('gibt den erreichten Zustand zurück', async () => {
    const store = useApiStatusStore()
    const client = clientWith(async () => ({ status: 'ok', version: '1.0' }))

    await expect(store.ensureChecked(client)).resolves.toBe('online')
  })

  it('meldet einen toten Dienst als offline, ohne zu werfen', async () => {
    const client = clientWith(async () => {
      throw new ApiError(0, 'Failed to fetch', 'https://falsch.example/health')
    })
    const store = useApiStatusStore()

    await expect(store.ensureChecked(client)).resolves.toBe('offline')
  })

  it('fragt nach einem erneuten `check` nicht noch einmal von selbst', async () => {
    const client = clientWith(async () => ({ status: 'ok', version: '1.0' }))
    const store = useApiStatusStore()

    await store.ensureChecked(client)
    await store.check(client)
    await store.ensureChecked(client)

    // Einmal durch ensureChecked, einmal durch den ausdrücklichen check.
    expect(client.health).toHaveBeenCalledTimes(2)
  })
})

/**
 * Die Adresse getrennt vom Satz.
 *
 * Im Dialog soll sie anklickbar sein — wer eine falsche Adresse sieht, will
 * sie ausprobieren, statt sie abzutippen. Aus dem fertigen Satz ließe sie sich
 * nur per Regex herausschneiden; sie steht ohnehin im Fehler.
 */
describe('useApiStatusStore — Adresse des Fehlschlags', () => {
  it('merkt sich die angefragte Adresse', async () => {
    const client = clientWith(async () => {
      throw new ApiError(0, 'Failed to fetch', 'https://falsch.example/health')
    })
    const store = useApiStatusStore()

    await store.check(client)

    expect(store.errorUrl).toBe('https://falsch.example/health')
  })

  it('lässt sie leer, wenn der Fehler keine trägt', async () => {
    const client = clientWith(async () => {
      throw new Error('irgendwas')
    })
    const store = useApiStatusStore()

    await store.check(client)

    expect(store.errorUrl).toBeNull()
  })

  it('räumt sie weg, sobald der Dienst wieder antwortet', async () => {
    const store = useApiStatusStore()
    await store.check(
      clientWith(async () => {
        throw new ApiError(0, 'Failed to fetch', 'https://falsch.example/health')
      }),
    )
    expect(store.errorUrl).not.toBeNull()

    await store.check(clientWith(async () => ({ status: 'ok', version: '1.0' })))

    expect(store.errorUrl).toBeNull()
  })
})
