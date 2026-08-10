/**
 * Tests für den API-Status.
 *
 * Der Grund für die Seite: Ohne die Gegenstelle gibt es keine Kurse und damit
 * keine einzige Kennzahl. Wenn etwas nicht geht, muss die Seite sagen, *was*
 * — „nicht erreichbar" allein hilft niemandem weiter.
 */

import { describe, expect, it, vi } from 'vitest'
import { useApiStatus } from '@/composables/useApiStatus'
import { StockInfoClient } from '@/api/client'
import { ApiError } from '@/api/errors'

/** Client, dessen `/health` antwortet wie vorgegeben. */
function clientWith(response: () => Promise<unknown>): StockInfoClient {
  const client = new StockInfoClient('https://example.test')
  vi.spyOn(client, 'health').mockImplementation(response as never)
  return client
}

describe('useApiStatus', () => {
  it('startet ungeprüft', () => {
    const status = useApiStatus(clientWith(async () => ({ status: 'ok', version: '1.0' })))

    expect(status.state.value).toBe('unknown')
    expect(status.checkedAt.value).toBeNull()
  })

  it('übernimmt Status und Version einer gesunden API', async () => {
    const status = useApiStatus(clientWith(async () => ({ status: 'ok', version: '2.3.1' })))
    await status.check()

    expect(status.state.value).toBe('online')
    expect(status.status.value).toBe('ok')
    expect(status.version.value).toBe('2.3.1')
    expect(status.error.value).toBeNull()
  })

  it('hält den Zeitpunkt der Prüfung fest', async () => {
    const status = useApiStatus(clientWith(async () => ({ status: 'ok', version: '1.0' })))
    await status.check()

    expect(status.checkedAt.value).not.toBeNull()
  })

  it('misst die Antwortzeit', async () => {
    const status = useApiStatus(clientWith(async () => ({ status: 'ok', version: '1.0' })))
    await status.check()

    expect(status.latencyMs.value).toBeGreaterThanOrEqual(0)
  })

  it('meldet den Grund, wenn die API einen Fehler liefert', async () => {
    const status = useApiStatus(
      clientWith(async () => {
        throw new ApiError(503, 'Service Unavailable', 'https://example.test/health')
      }),
    )
    await status.check()

    expect(status.state.value).toBe('offline')
    expect(status.error.value).toContain('Service Unavailable')
    expect(status.error.value).toContain('503')
  })

  it('nennt bei ausbleibender Antwort die Adresse — dort liegt meist die Ursache', async () => {
    // Status 0 heißt: gar keine Antwort. Netz, falsche Adresse oder CORS.
    const status = useApiStatus(
      clientWith(async () => {
        throw new ApiError(0, 'Netzwerkfehler', 'https://example.test/health')
      }),
    )
    await status.check()

    expect(status.error.value).toContain('https://example.test/health')
  })

  it('verwirft alte Werte, wenn die Prüfung fehlschlägt', async () => {
    // Sonst stünde eine Version auf der Seite, die gerade niemand bestätigt.
    let healthy = true
    const status = useApiStatus(
      clientWith(async () => {
        if (healthy) return { status: 'ok', version: '2.3.1' }
        throw new ApiError(0, 'weg', 'https://example.test/health')
      }),
    )

    await status.check()
    expect(status.version.value).toBe('2.3.1')

    healthy = false
    await status.check()
    expect(status.version.value).toBeNull()
    expect(status.status.value).toBeNull()
  })

  it('kommt ohne Client zurecht, statt zu werfen', async () => {
    const status = useApiStatus(null)
    await status.check()

    expect(status.state.value).toBe('offline')
    expect(status.error.value).toBe('Kein API-Client verfügbar')
  })

  it('gibt die konfigurierte Adresse unverändert zurück', () => {
    // Sie stammt aus dem .env-File und ist im Container die einzige Stelle,
    // an der sich das angesprochene Backend ablesen lässt.
    expect(new StockInfoClient('https://stockinfo.example/').url).toBe('https://stockinfo.example')
  })
})
