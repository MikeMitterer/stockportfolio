import { describe, expect, it, vi } from 'vitest'
import { PrivateDataClient, PrivateDataError } from '@/api/data/client'

/** Antwort der Konto-API mit JSON-Rumpf, wie `PrivateDataClient` sie liest. */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

/** Liste mit einem Depot in Revision 2. */
const LISTED_DEPOT = {
  resources: [{ resourceId: 'depot', revision: 2, value: { id: 'depot' } }],
}

describe('private REST-Daten', () => {
  it('merkt die zuletzt geladene Revision für den Ereignisabgleich', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(LISTED_DEPOT))
      .mockResolvedValueOnce(jsonResponse({ resources: [] }))
    const client = new PrivateDataClient(fetcher)

    expect(client.revisionOf('portfolio', 'depot')).toBeNull()
    await client.list('portfolio')
    expect(client.revisionOf('portfolio', 'depot')).toBe(2)
    await client.list('portfolio')
    expect(client.revisionOf('portfolio', 'depot')).toBeNull()
  })
  it('sendet die gelesene Revision beim Speichern und meldet einen Konkurrenzkonflikt', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ resourceId: 'depot', revision: 3, value: { id: 'depot' } }),
      )
      .mockResolvedValueOnce(jsonResponse({ error: 'revision_conflict' }, 409))
    const client = new PrivateDataClient(fetcher)

    expect((await client.get<{ id: string }>('portfolio', 'depot'))?.revision).toBe(3)
    await expect(client.save('portfolio', 'depot', { id: 'depot' })).rejects.toMatchObject({
      status: 409,
      code: 'revision_conflict',
    } satisfies Partial<PrivateDataError>)
    const options = fetcher.mock.calls[1]?.[1]
    expect(JSON.parse(String(options?.body)).revision).toBe(3)
  })

  it('holt nach einem konkurrierenden Hintergrund-Schnappschuss die neue Revision und schreibt erneut', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ resourceId: 'depot', revision: 1, value: [] }))
      .mockResolvedValueOnce(jsonResponse({ error: 'revision_conflict' }, 409))
      .mockResolvedValueOnce(
        jsonResponse({ resourceId: 'depot', revision: 2, value: [{ total: 100 }] }),
      )
      .mockResolvedValueOnce(jsonResponse({ revision: 3 }))
    const client = new PrivateDataClient(fetcher)
    const errors: Event[] = []
    const listener = (event: Event): void => {
      errors.push(event)
    }
    window.addEventListener('stockportfolio:data-error', listener)
    try {
      await client.update<{ total: number }[]>(
        'snapshots',
        'depot',
        (current) => [...(current ?? []), { total: 200 }],
        { conflictRetries: 2, reportConflict: false },
      )
    } finally {
      window.removeEventListener('stockportfolio:data-error', listener)
    }

    expect(errors).toEqual([])
    expect(client.revisionOf('snapshots', 'depot')).toBe(3)
    expect(JSON.parse(String(fetcher.mock.calls[3]?.[1]?.body))).toEqual({
      revision: 2,
      value: [{ total: 100 }, { total: 200 }],
    })
  })

  it('legt bei Netzfehlern keine lokale Erfolgsmeldung nahe', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'))
    const client = new PrivateDataClient(fetcher)
    await expect(client.save('portfolio', 'depot', { id: 'depot' })).rejects.toMatchObject({
      status: 0,
      code: 'unavailable',
    } satisfies Partial<PrivateDataError>)
  })

  it('verwirft nach einem entfernten Depot dessen alte Revision', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(LISTED_DEPOT))
      .mockResolvedValueOnce(jsonResponse({ resources: [] }))
      .mockResolvedValueOnce(jsonResponse({ revision: 1 }))
    const client = new PrivateDataClient(fetcher)

    await client.list('portfolio')
    await client.list('portfolio')
    await client.save('portfolio', 'depot', { id: 'depot' })

    expect(JSON.parse(String(fetcher.mock.calls[2]?.[1]?.body)).revision).toBe(0)
  })

  it('verwirft eine alte Revision auch nach einem gezielten 404-Abruf', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ resourceId: 'depot', revision: 3, value: { id: 'depot' } }),
      )
      .mockResolvedValueOnce(jsonResponse({ error: 'not_found' }, 404))
      .mockResolvedValueOnce(jsonResponse({ revision: 1 }))
    const client = new PrivateDataClient(fetcher)

    await client.get('portfolio', 'depot')
    expect(await client.get('portfolio', 'depot')).toBeNull()
    await client.save('portfolio', 'depot', { id: 'depot' })

    expect(JSON.parse(String(fetcher.mock.calls[2]?.[1]?.body)).revision).toBe(0)
  })
})
