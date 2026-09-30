import { describe, expect, it, vi } from 'vitest'
import { PrivateDataClient, PrivateDataError } from '@/data/client'

describe('private REST-Daten', () => {
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

  it('legt bei Netzfehlern keine lokale Erfolgsmeldung nahe', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'))
    const client = new PrivateDataClient(fetcher)
    await expect(client.save('portfolio', 'depot', { id: 'depot' })).rejects.toMatchObject({
      status: 0, code: 'unavailable',
    } satisfies Partial<PrivateDataError>)
  })
})
