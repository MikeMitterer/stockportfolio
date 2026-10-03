import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

vi.mock('@/data/repository', () => import('../helpers/localRepositories'))
import { createPinia, setActivePinia } from 'pinia'
import { deleteDB } from 'idb'
import { LiveEventsClient } from '@/data/liveEvents'
import { activatePrivateData, deactivatePrivateData, PrivateDataClient } from '@/data/client'
import { PortfolioRepository } from '@/db/repository'
import { closeDb, DB_NAME } from '@/db/schema'
import { useLiveSyncStore } from '@/stores/liveSync'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { useQuotesStore } from '@/stores/quotes'
import type { StockInfoClient } from '@/api/client'

class FakeEventStream extends EventTarget {
  closed = false
  readyState = 1

  close(): void {
    this.closed = true
  }

  resource(id: string, revision: number, kind = 'portfolio'): void {
    this.dispatchEvent(new MessageEvent('resource', {
      data: JSON.stringify({ kind, resourceId: id, revision }),
    }))
  }
}

beforeEach(async () => {
  setActivePinia(createPinia())
  await closeDb()
  await deleteDB(DB_NAME)
})

afterEach(async () => {
  deactivatePrivateData()
  await closeDb()
})

describe('Live-Abgleich der Stores', () => {
  it('nutzt den Ersatzabruf nur, solange keine SSE-Verbindung steht (T-85)', async () => {
    const portfolio = usePortfolioStore()
    await portfolio.load()
    const refresh = vi.spyOn(portfolio, 'refreshFromServer')
    const stream = new FakeEventStream()
    const live = useLiveSyncStore()
    // Kurzer Takt statt 30 s; das Verhalten hängt nur vom Zustand ab.
    const fallbackMs = 20
    live.start(new LiveEventsClient(() => stream), fallbackMs)
    // Bricht der Test ab, darf kein 20-ms-Takt in den nächsten Test laufen.
    let afterReconnect = 0
    try {
      // Vor dem ersten Verbinden springt der Ersatzabruf ein.
      await vi.waitFor(() => expect(refresh).toHaveBeenCalled())
      stream.dispatchEvent(new Event('open'))
      expect(live.status).toBe('connected')
      await new Promise((resolve) => setTimeout(resolve, fallbackMs * 2))
      await flushPromises()
      const afterConnect = refresh.mock.calls.length

      // Steht die Verbindung, lädt nur noch ein SSE-Ereignis neu.
      await new Promise((resolve) => setTimeout(resolve, fallbackMs * 6))
      await flushPromises()
      expect(refresh).toHaveBeenCalledTimes(afterConnect)

      // Reißt sie ab, springt der Ersatzabruf wieder ein.
      stream.dispatchEvent(new Event('error'))
      expect(live.status).toBe('disconnected')
      await vi.waitFor(() => expect(refresh.mock.calls.length).toBeGreaterThan(afterConnect + 1))

      // Nach dem Wiederverbinden lädt die App einmal neu, danach ist Ruhe.
      stream.dispatchEvent(new Event('open'))
      await new Promise((resolve) => setTimeout(resolve, fallbackMs * 2))
      await flushPromises()
      afterReconnect = refresh.mock.calls.length
      await new Promise((resolve) => setTimeout(resolve, fallbackMs * 6))
      await flushPromises()
      expect(refresh).toHaveBeenCalledTimes(afterReconnect)
    } finally {
      live.stop()
    }

    // Nach dem Abmelden läuft nichts weiter.
    await new Promise((resolve) => setTimeout(resolve, fallbackMs * 4))
    await flushPromises()
    expect(refresh).toHaveBeenCalledTimes(afterReconnect)
  })

  it('ignoriert das eigene Ereignis, auch wenn es vor der Schreibantwort ankommt', async () => {
    const portfolio = usePortfolioStore()
    await portfolio.load()
    const id = portfolio.portfolio!.id
    let finishWrite: ((response: Response) => void) | undefined
    const fetcher = vi.fn<typeof fetch>().mockImplementation(() => new Promise<Response>((resolve) => {
      finishWrite = resolve
    }))
    const dataClient = new PrivateDataClient(fetcher)
    activatePrivateData(dataClient)
    const refresh = vi.spyOn(portfolio, 'refreshFromServer')
    const stream = new FakeEventStream()
    const live = useLiveSyncStore()
    live.start(new LiveEventsClient(() => stream))

    const write = dataClient.save('portfolio', id, portfolio.portfolio!)
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
    stream.resource(id, 1)
    finishWrite!(new Response(JSON.stringify({ revision: 1 }), { status: 200 }))
    await write
    await flushPromises()

    expect(refresh).not.toHaveBeenCalled()
    live.stop()
  })

  it('lädt auch eine bereits per GET bekannte Revision, deren Anzeige noch nicht aktualisiert wurde', async () => {
    const portfolio = usePortfolioStore()
    await portfolio.load()
    const id = portfolio.portfolio!.id
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      resources: [{ resourceId: id, revision: 1, value: portfolio.portfolio }],
    }), { status: 200 }))
    const client = new PrivateDataClient(fetcher)
    await client.list('portfolio')
    activatePrivateData(client)
    const refresh = vi.spyOn(portfolio, 'refreshFromServer')
    const stream = new FakeEventStream()
    const live = useLiveSyncStore()
    live.start(new LiveEventsClient(() => stream))

    stream.resource(id, 1)
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())

    stream.resource(id, 2)
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(2))
    live.stop()
  })

  it('holt nach einem Kurs-Hinweis neue Kurse, ohne das Depot erneut zu laden', async () => {
    const portfolio = usePortfolioStore()
    await portfolio.load()
    const refresh = vi.spyOn(portfolio, 'refreshFromServer')
    const loadQuotes = vi.spyOn(useQuotesStore(), 'loadQuotes').mockResolvedValue()
    const stream = new FakeEventStream()
    const live = useLiveSyncStore()
    live.start(new LiveEventsClient(() => stream), 30_000, {} as StockInfoClient)

    stream.resource('current', 1, 'quote-refresh')
    await vi.waitFor(() => expect(loadQuotes).toHaveBeenCalledOnce())
    expect(refresh).not.toHaveBeenCalled()
    stream.resource('current', 1, 'quote-refresh')
    await flushPromises()
    expect(loadQuotes).toHaveBeenCalledOnce()
    live.stop()
  })

  it('folgt dem Kurs-Hinweis auch, wenn seine Revision auf dem Server zurückfällt', async () => {
    // Etwa nach dem Zurückspielen einer älteren Datenbank: Nur eine gleiche
    // Revision ist bereits bekannt, eine abweichende ist ein neuer Hinweis.
    const portfolio = usePortfolioStore()
    await portfolio.load()
    const loadQuotes = vi.spyOn(useQuotesStore(), 'loadQuotes').mockResolvedValue()
    const stream = new FakeEventStream()
    const live = useLiveSyncStore()
    live.start(new LiveEventsClient(() => stream), 30_000, {} as StockInfoClient)

    stream.resource('current', 5, 'quote-refresh')
    await vi.waitFor(() => expect(loadQuotes).toHaveBeenCalledTimes(1))
    stream.resource('current', 1, 'quote-refresh')
    await vi.waitFor(() => expect(loadQuotes).toHaveBeenCalledTimes(2))
    stream.resource('current', 1, 'quote-refresh')
    await flushPromises()
    expect(loadQuotes).toHaveBeenCalledTimes(2)
    live.stop()
  })

  it('lädt ein fremd geändertes Depot und gleicht nach Wiederverbindung erneut ab', async () => {
    const portfolio = usePortfolioStore()
    await portfolio.load()
    const id = portfolio.portfolio!.id
    await useSettingsStore().load(id)
    const stream = new FakeEventStream()
    const live = useLiveSyncStore()
    live.start(new LiveEventsClient(() => stream))
    stream.dispatchEvent(new Event('open'))
    expect(live.status).toBe('connected')

    const repository = new PortfolioRepository()
    await repository.save({ ...portfolio.portfolio!, name: 'Laptop' })
    stream.resource(id, 2)
    await vi.waitFor(() => expect(portfolio.portfolio?.name).toBe('Laptop'))

    stream.dispatchEvent(new Event('error'))
    expect(live.status).toBe('disconnected')
    await repository.save({ ...portfolio.portfolio!, name: 'Tablet' })
    stream.dispatchEvent(new Event('open'))
    await vi.waitFor(() => expect(portfolio.portfolio?.name).toBe('Tablet'))

    live.stop()
    expect(stream.closed).toBe(true)
  })

  it('holt bei unterbrochenem Stream den Serverstand ersatzweise ab', async () => {
    const portfolio = usePortfolioStore()
    await portfolio.load()
    const repository = new PortfolioRepository()
    const stream = new FakeEventStream()
    const live = useLiveSyncStore()
    live.start(new LiveEventsClient(() => stream), 20)
    stream.dispatchEvent(new Event('error'))
    await repository.save({ ...portfolio.portfolio!, name: 'Ohne SSE' })

    await vi.waitFor(() => expect(portfolio.portfolio?.name).toBe('Ohne SSE'), { timeout: 500 })
    expect(live.status).toBe('disconnected')
    live.stop()
  })

  it('holt den Serverstand auch bei dauerhaft ausstehender Verbindung ab', async () => {
    const portfolio = usePortfolioStore()
    await portfolio.load()
    const repository = new PortfolioRepository()
    const live = useLiveSyncStore()
    live.start(new LiveEventsClient(() => new FakeEventStream()), 20)
    await repository.save({ ...portfolio.portfolio!, name: 'Ohne Verbindungsaufbau' })

    await vi.waitFor(() => expect(portfolio.portfolio?.name).toBe('Ohne Verbindungsaufbau'), { timeout: 500 })
    expect(live.status).toBe('connecting')
    live.stop()
  })

  it('holt eine bei stehendem Stream verpasste Änderung bei der Rückkehr zum Tab ab', async () => {
    // Mike, 2026-10-03 (T-85): Bei stehender Verbindung gilt SSE; ein fester
    // Ersatzabruf läuft dann nicht mehr. Die Rückkehr zum Tab prüft weiterhin.
    const portfolio = usePortfolioStore()
    await portfolio.load()
    const repository = new PortfolioRepository()
    const stream = new FakeEventStream()
    const live = useLiveSyncStore()
    const refresh = vi.spyOn(portfolio, 'refreshFromServer')
    live.start(new LiveEventsClient(() => stream), 20)
    stream.dispatchEvent(new Event('open'))
    await flushPromises()
    expect(refresh).toHaveBeenCalled()
    await repository.save({ ...portfolio.portfolio!, name: 'Verpasste Änderung' })

    await new Promise((resolve) => setTimeout(resolve, 120))
    await flushPromises()
    expect(portfolio.portfolio?.name).not.toBe('Verpasste Änderung')

    document.dispatchEvent(new Event('visibilitychange'))
    await vi.waitFor(() => expect(portfolio.portfolio?.name).toBe('Verpasste Änderung'), { timeout: 500 })
    expect(live.status).toBe('connected')
    live.stop()
  })
})
