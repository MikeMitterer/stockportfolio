import { describe, expect, it, vi } from 'vitest'
import { PrivateDataClient, PrivateDataError } from '@/api/data/client'

describe('private REST-Daten', () => {
  it('merkt die zuletzt geladene Revision für den Ereignisabgleich', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ resources: [{ resourceId: 'depot', revision: 2, value: { id: 'depot' } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ resources: [] }), { status: 200 }))
    const client = new PrivateDataClient(fetcher)

    expect(client.revisionOf('portfolio', 'depot')).toBeNull()
    await client.list('portfolio')
    expect(client.revisionOf('portfolio', 'depot')).toBe(2)
    await client.list('portfolio')
    expect(client.revisionOf('portfolio', 'depot')).toBeNull()
  })
  it('sendet die gelesene Revision beim Speichern und meldet einen Konkurrenzkonflikt', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ resourceId: 'depot', revision: 3, value: { id: 'depot' } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'revision_conflict' }), { status: 409 }))
    const client = new PrivateDataClient(fetcher)

    expect((await client.get<{ id: string }>('portfolio', 'depot'))?.revision).toBe(3)
    await expect(client.save('portfolio', 'depot', { id: 'depot' })).rejects.toMatchObject({
      status: 409, code: 'revision_conflict',
    } satisfies Partial<PrivateDataError>)
    const options = fetcher.mock.calls[1]?.[1]
    expect(JSON.parse(String(options?.body)).revision).toBe(3)
  })

  it('holt nach einem konkurrierenden Hintergrund-Schnappschuss die neue Revision und schreibt erneut', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ resourceId: 'depot', revision: 1, value: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'revision_conflict' }), { status: 409 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ resourceId: 'depot', revision: 2, value: [{ total: 100 }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ revision: 3 }), { status: 200 }))
    const client = new PrivateDataClient(fetcher)
    const errors: Event[] = []
    const listener = (event: Event): void => { errors.push(event) }
    window.addEventListener('stockportfolio:data-error', listener)
    try {
      await client.update<{ total: number }[]>('snapshots', 'depot', (current) => [
        ...(current ?? []), { total: 200 },
      ], { conflictRetries: 2, reportConflict: false })
    } finally {
      window.removeEventListener('stockportfolio:data-error', listener)
    }

    expect(errors).toEqual([])
    expect(client.revisionOf('snapshots', 'depot')).toBe(3)
    expect(JSON.parse(String(fetcher.mock.calls[3]?.[1]?.body))).toEqual({
      revision: 2, value: [{ total: 100 }, { total: 200 }],
    })
  })

  it('legt bei Netzfehlern keine lokale Erfolgsmeldung nahe', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'))
    const client = new PrivateDataClient(fetcher)
    await expect(client.save('portfolio', 'depot', { id: 'depot' })).rejects.toMatchObject({
      status: 0, code: 'unavailable',
    } satisfies Partial<PrivateDataError>)
  })

  it('verwirft nach einem entfernten Depot dessen alte Revision', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ resources: [{ resourceId: 'depot', revision: 2, value: { id: 'depot' } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ resources: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ revision: 1 }), { status: 200 }))
    const client = new PrivateDataClient(fetcher)

    await client.list('portfolio')
    await client.list('portfolio')
    await client.save('portfolio', 'depot', { id: 'depot' })

    expect(JSON.parse(String(fetcher.mock.calls[2]?.[1]?.body)).revision).toBe(0)
  })

  it('verwirft eine alte Revision auch nach einem gezielten 404-Abruf', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ resourceId: 'depot', revision: 3, value: { id: 'depot' } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'not_found' }), { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ revision: 1 }), { status: 200 }))
    const client = new PrivateDataClient(fetcher)

    await client.get('portfolio', 'depot')
    expect(await client.get('portfolio', 'depot')).toBeNull()
    await client.save('portfolio', 'depot', { id: 'depot' })

    expect(JSON.parse(String(fetcher.mock.calls[2]?.[1]?.body)).revision).toBe(0)
  })
})
