import { defineStore } from 'pinia'
import { ref } from 'vue'
import { LiveEventsClient, type ResourceEvent } from '@/data/liveEvents'
import { DATA_RECOVERED_EVENT, privateDataClient } from '@/data/client'
import type { StockInfoClient } from '@/api/client'
import { baseCurrencyOf } from '@/domain/fx'
import { useInstrumentsStore } from '@/stores/instruments'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { useSettingsStore } from '@/stores/settings'
import { useValueHistoryStore } from '@/stores/valueHistory'

export const useLiveSyncStore = defineStore('liveSync', () => {
  const status = ref<'connecting' | 'connected' | 'disconnected'>('connecting')
  const syncing = ref(false)
  const portfolio = usePortfolioStore()
  const quotes = useQuotesStore()
  const settings = useSettingsStore()
  const instruments = useInstrumentsStore()
  const history = useValueHistoryStore()
  let client: LiveEventsClient | null = null
  let quoteClient: StockInfoClient | null = null
  let fallbackTimer: ReturnType<typeof setInterval> | null = null
  let pending: Promise<void> = Promise.resolve()
  let visiblePending = 0
  let generation = 0
  let lastQuoteRevision = 0

  async function refreshQuotes(): Promise<void> {
    if (!quoteClient || !portfolio.portfolio) return
    await quotes.loadQuotesIfStale(quoteClient, portfolio.positions, settings.settings.refresh.staleAfterMinutes)
  }

  /** Nach einem ausdrücklichen Kursabruf sehen andere Fenster desselben Kontos frische Kurse. */
  async function announceQuoteRefresh(): Promise<void> {
    const dataClient = privateDataClient()
    if (!dataClient) return
    const revision = await dataClient.update<{ refreshedAt: string }>(
      'quote-refresh', 'current', () => ({ refreshedAt: new Date().toISOString() }),
      { conflictRetries: 2, reportConflict: false },
    )
    lastQuoteRevision = Math.max(lastQuoteRevision, revision)
  }

  async function refreshAnnouncedQuotes(): Promise<boolean> {
    const resource = await privateDataClient()?.get<{ refreshedAt: string }>('quote-refresh', 'current')
    if (!resource || resource.revision <= lastQuoteRevision || !quoteClient || !portfolio.portfolio) return false
    await quotes.loadQuotes(quoteClient, portfolio.positions)
    lastQuoteRevision = resource.revision
    return true
  }

  async function selectActivePortfolio(): Promise<void> {
    if (!settings.loaded) return
    const id = settings.settings.activePortfolioId
    if (id && portfolio.all.some((entry) => entry.id === id) && portfolio.portfolio?.id !== id) {
      await portfolio.switchTo(id)
    }
  }

  async function refreshAll(): Promise<void> {
    if (!portfolio.loaded) return
    await portfolio.refreshFromServer()
    if (settings.loaded) await settings.refreshFromServer()
    await selectActivePortfolio()
    if (!(await refreshAnnouncedQuotes())) await refreshQuotes()
    if (instruments.loaded && portfolio.portfolio) await instruments.hydrateAllowlist()
    if (history.loaded && portfolio.portfolio) {
      await history.load(portfolio.portfolio.id, baseCurrencyOf(portfolio.portfolio))
    }
    window.dispatchEvent(new Event(DATA_RECOVERED_EVENT))
  }

  async function refreshResource(event: ResourceEvent): Promise<void> {
    if (!portfolio.loaded) return
    if (event.kind === 'portfolio') {
      await portfolio.refreshFromServer()
      await selectActivePortfolio()
      await refreshQuotes()
    } else if (event.kind === 'settings' && settings.loaded) {
      await settings.refreshFromServer()
      await selectActivePortfolio()
      await refreshQuotes()
    } else if (event.kind === 'allowlist' && instruments.loaded && portfolio.portfolio?.id === event.resourceId) {
      await instruments.hydrateAllowlist()
    } else if (event.kind === 'snapshots' && history.loaded && portfolio.portfolio?.id === event.resourceId) {
      await history.load(event.resourceId, baseCurrencyOf(portfolio.portfolio))
    } else if (event.kind === 'quote-refresh' && event.resourceId === 'current' && event.revision > lastQuoteRevision && quoteClient && portfolio.portfolio) {
      await quotes.loadQuotes(quoteClient, portfolio.positions)
      lastQuoteRevision = event.revision
    }
  }

  function queue(action: () => Promise<void>, showLoader = false): void {
    const queuedGeneration = generation
    let loaderStarted = false
    const loaderTimer = showLoader ? setTimeout(() => {
      if (queuedGeneration !== generation) return
      loaderStarted = true
      visiblePending += 1
      syncing.value = true
    }, 250) : null
    pending = pending.catch(() => undefined).then(async () => {
      if (queuedGeneration === generation) await action()
    }).catch((error: unknown) => {
      if (queuedGeneration !== generation) return
      status.value = 'disconnected'
      console.error('Private data synchronization failed', error)
    }).finally(() => {
      if (loaderTimer !== null) clearTimeout(loaderTimer)
      if (loaderStarted && queuedGeneration === generation) {
        visiblePending -= 1
        syncing.value = visiblePending > 0
      }
    })
  }

  function onVisibilityChange(): void {
    if (document.visibilityState === 'visible') queue(refreshAll, true)
  }

  async function onResource(event: ResourceEvent, eventsClient: LiveEventsClient): Promise<void> {
    const dataClient = privateDataClient()
    await dataClient?.whenIdle(event.kind, event.resourceId)
    if (client !== eventsClient || dataClient?.wroteRevision(event.kind, event.resourceId, event.revision)) return
    queue(() => refreshResource(event), event.kind === 'portfolio' || event.kind === 'settings' || event.kind === 'quote-refresh')
  }

  function start(eventsClient = new LiveEventsClient(), fallbackMs = 30_000, stockInfoClient?: StockInfoClient): void {
    stop()
    client = eventsClient
    quoteClient = stockInfoClient ?? null
    lastQuoteRevision = 0
    status.value = 'connecting'
    eventsClient.start({
      connected: () => {
        status.value = 'connected'
        queue(refreshAll, true)
      },
      disconnected: () => { status.value = 'disconnected' },
      resource: (event) => { void onResource(event, eventsClient) },
    })
    document.addEventListener('visibilitychange', onVisibilityChange)
    fallbackTimer = setInterval(() => queue(refreshAll, true), fallbackMs)
  }

  function stop(): void {
    generation += 1
    client?.stop()
    client = null
    quoteClient = null
    if (fallbackTimer !== null) clearInterval(fallbackTimer)
    fallbackTimer = null
    document.removeEventListener('visibilitychange', onVisibilityChange)
    visiblePending = 0
    syncing.value = false
    status.value = 'disconnected'
  }

  return { status, syncing, start, stop, announceQuoteRefresh }
})
