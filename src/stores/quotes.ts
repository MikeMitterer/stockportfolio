/**
 * Pinia-Store für Kurse.
 *
 * Hält den Kurs-Cache im Speicher, persistiert ihn nach IndexedDB und lädt
 * ihn beim Start zurück — dadurch zeigt die App sofort die zuletzt bekannten
 * Preise, statt auf das Netzwerk zu warten.
 */

import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { consola } from 'consola'
import { translate } from '@/i18n'
import { ApiError } from '@/api/errors'
import { toQuoteCacheEntry } from '@/api/mappers'
import { QuoteCacheRepository } from '@/db/repository'
import { quoteKey } from '@/domain/rebalancing'
import type { StockInfoClient } from '@/api/client'
import type { QuoteResponse } from '@/api/types'
import type { Position, QuoteCacheEntry, QuoteMap } from '@/types/portfolio'

/** Maximale Anzahl gleichzeitiger Kursabfragen — schont die API. */
const MAX_CONCURRENT_REQUESTS = 6

/** Fehlgeschlagene Kursabfrage einer einzelnen Position. */
export interface QuoteFailure {
  key: string
  symbol: string
  reason: string
}

export const useQuotesStore = defineStore('quotes', () => {
  const repository = new QuoteCacheRepository()

  const quotes = shallowRef<QuoteMap>(new Map())
  const loading = ref<boolean>(false)
  /**
   * Positionen, deren Kurs gerade einzeln geholt wird — daran hängt der
   * Spinner am Knopf im Drilldown.
   *
   * Eine Menge und kein Schalter: Es können mehrere Zeilen offen sein, und wer
   * zwei nacheinander anstößt, soll an beiden sehen, dass etwas läuft.
   */
  const refreshing = ref<Set<string>>(new Set())
  const failures = ref<QuoteFailure[]>([])

  /*
   * Fortschritt über alle laufenden Abrufe, für den Balken am oberen Rand.
   *
   * Zwei Zähler statt eines Objekts je Vorgang: Es können mehrere gleichzeitig
   * laufen — ein Einzel-Refresh, während der Seitenaufruf noch lädt —, und
   * addierte Zahlen ergeben von selbst einen gemeinsamen Balken. Beide stehen
   * auf 0, wenn nichts läuft.
   */
  const progressTotal = ref<number>(0)
  const progressDone = ref<number>(0)

  /**
   * Läuft gerade ein **angestoßener** Abruf?
   *
   * Hängt allein am Klick, nicht am Laden überhaupt: Ein Knopf, der dreht,
   * ohne dass ihn jemand gedrückt hat, behauptet eine Handlung, die es nicht
   * gab — und sperrt sich obendrein in einem Moment, in dem man ihn vielleicht
   * gerade drücken will.
   */
  const forcing = ref<boolean>(false)

  const busy = computed<boolean>(() => progressTotal.value > 0)

  const progressPercent = computed<number>(() =>
    progressTotal.value === 0
      ? 0
      : Math.round((progressDone.value / progressTotal.value) * 100),
  )

  /** Meldet `count` beginnende Abrufe an. */
  function beginProgress(count: number): void {
    progressTotal.value += count
  }

  /** Meldet einen erledigten Abruf; der letzte setzt beide Zähler zurück. */
  function stepProgress(): void {
    progressDone.value += 1
    if (progressDone.value < progressTotal.value) return
    progressTotal.value = 0
    progressDone.value = 0
  }
  const lastRefreshAt = ref<string | null>(null)

  /** Lädt den persistierten Cache — zeigt sofort Werte, bevor das Netz antwortet. */
  async function hydrate(): Promise<void> {
    const cached = await repository.loadAll()
    if (cached.size === 0) return

    quotes.value = cached
    lastRefreshAt.value = newestFetchedAt(cached)
  }

  /**
   * Lädt Kurse für alle kursrelevanten Positionen.
   * Cash wird übersprungen; ein Fehlschlag bricht die übrigen nicht ab.
   */
  /**
   * Sortiert die Antworten in Kurse und Ausfälle.
   *
   * Ein Ausfall wirft den alten Kurs nicht weg, sondern markiert ihn als
   * veraltet — eine Lücke in der Tabelle wäre schlimmer als eine Zahl von
   * gestern, weil daran jede Kennzahl hängt.
   *
   * @param results  Ergebnisse der Einzelabrufe.
   * @param previous Bisheriger Cache-Stand.
   */
  function sortOutcomes(
    results: FetchOutcome[],
    previous: QuoteMap,
  ): { quotes: QuoteMap; failures: QuoteFailure[] } {
    const nextQuotes: QuoteMap = new Map()
    const nextFailures: QuoteFailure[] = []

    for (const result of results) {
      if (result.entry) {
        nextQuotes.set(result.key, result.entry)
        continue
      }

      const known = previous.get(result.key)
      if (known) nextQuotes.set(result.key, { ...known, stale: true })
      nextFailures.push({
        key: result.key,
        symbol: result.symbol,
        reason: result.reason ?? translate('notify.unknownError'),
      })
    }

    return { quotes: nextQuotes, failures: nextFailures }
  }

  /** Übernimmt einen neuen Cache-Stand und schreibt ihn durch. */
  async function commit(nextQuotes: QuoteMap, nextFailures: QuoteFailure[]): Promise<void> {
    quotes.value = nextQuotes
    failures.value = nextFailures
    lastRefreshAt.value = new Date().toISOString()
    await repository.replaceAll(nextQuotes)
  }

  /**
   * Lädt die Kurse aller Positionen.
   *
   * `force` gehört dem ausdrücklichen Klick: Wer „Aktualisieren" drückt, will
   * frische Kurse und nicht dieselbe Zahl. Beim automatischen Laden — Seiten-
   * aufruf, Ansichtswechsel, Depotwechsel — bleibt es bei der TTL des
   * Dienstes; dort wäre ein Live-Abruf je Position pure Last ohne Anlass.
   */
  async function loadQuotes(
    client: StockInfoClient,
    positions: Position[],
    options: { force?: boolean } = {},
  ): Promise<void> {
    const relevant = positions.filter((position) => position.enabled && position.group !== 'cash')
    if (relevant.length === 0) {
      await commit(new Map(), [])
      return
    }

    const force = options.force ?? false

    loading.value = true
    if (force) forcing.value = true
    beginProgress(relevant.length)
    failures.value = []

    try {
      const results = await mapWithConcurrency(
        relevant,
        MAX_CONCURRENT_REQUESTS,
        async (position) => {
          // `fetchOne` wirft nie — der Schritt wird also in jedem Fall gezählt.
          const outcome = await fetchOne(client, position, force)
          stepProgress()
          return outcome
        },
      )
      const sorted = sortOutcomes(results, quotes.value)
      await commit(sorted.quotes, sorted.failures)

      if (sorted.failures.length > 0) {
        consola.warn('quotes: Kurse teilweise nicht geladen', {
          failed: sorted.failures.length,
          total: relevant.length,
        })
      }
    } finally {
      loading.value = false
      forcing.value = false
    }
  }

  /**
   * Lädt nur, wenn es sich lohnt — für das automatische Laden gedacht.
   *
   * Ein Wechsel zwischen den Ansichten baut die Seite neu auf und löste bisher
   * jedes Mal einen vollen Durchgang aus: n Anfragen für Kurse, die zehn
   * Sekunden alt sein konnten. Der Klick auf „Aktualisieren" geht weiter
   * ungefragt durch — wer drückt, will neue Kurse.
   *
   * Die Frist gilt **nur für Vollständiges**: Fehlt einer Position ihr Kurs —
   * gerade angelegt, letzter Abruf gescheitert —, wird geladen, sonst bliebe
   * die Zeile bis zum Ende der Frist ohne Wert.
   *
   * @param maxAgeMinutes Alter, ab dem die Kurse als veraltet gelten.
   */
  async function loadQuotesIfStale(
    client: StockInfoClient,
    positions: Position[],
    maxAgeMinutes: number,
  ): Promise<void> {
    if (!isStale(maxAgeMinutes) && hasQuoteForAll(positions)) return
    await loadQuotes(client, positions)
  }

  /** Ist der letzte Abruf länger her als `maxAgeMinutes`? */
  function isStale(maxAgeMinutes: number): boolean {
    if (!lastRefreshAt.value) return true
    const age = Date.now() - Date.parse(lastRefreshAt.value)
    return Number.isNaN(age) || age >= maxAgeMinutes * 60_000
  }

  /** Hat jede Position, die einen Kurs haben kann, auch einen? */
  function hasQuoteForAll(positions: Position[]): boolean {
    return positions
      .filter((position) => position.enabled && position.group !== 'cash')
      .every((position) => quotes.value.has(quoteKey(position)))
  }

  /** Lädt den Kurs einer einzelnen Position neu (Server-Refresh erzwungen). */
  async function refreshOne(client: StockInfoClient, position: Position): Promise<void> {
    if (position.group === 'cash') return

    const key = quoteKey(position)
    markRefreshing(position.id, true)
    beginProgress(1)

    try {
      const response = await requestQuote(client, position, true)

      const entry = toQuoteCacheEntry(response)
      const next = new Map(quotes.value)
      next.set(key, entry)
      quotes.value = next
      failures.value = failures.value.filter((failure) => failure.key !== key)
      await repository.put(key, entry)
    } catch (error) {
      const reason = error instanceof ApiError ? error.detail : translate('notify.unknownError')
      consola.error('quotes: Einzel-Refresh fehlgeschlagen', {
        symbol: position.symbol,
        reason,
      })
      failures.value = [
        ...failures.value.filter((failure) => failure.key !== key),
        { key, symbol: position.symbol, reason },
      ]
    } finally {
      // `finally`, nicht am Ende des `try`: Ein Fehlschlag darf weder den Knopf
      // ewig drehen lassen noch den Balken oben stehen.
      markRefreshing(position.id, false)
      stepProgress()
    }
  }

  /** Setzt oder löscht den Ladezustand einer Position. */
  function markRefreshing(id: string, active: boolean): void {
    const next = new Set(refreshing.value)
    if (active) {
      next.add(id)
    } else {
      next.delete(id)
    }
    refreshing.value = next
  }

  return {
    quotes,
    loading,
    refreshing,
    forcing,
    busy,
    progressTotal,
    progressDone,
    progressPercent,
    failures,
    lastRefreshAt,
    hydrate,
    loadQuotes,
    loadQuotesIfStale,
    refreshOne,
  }
})

/** Jüngster `fetchedAt`-Zeitstempel einer Cache-Map. */
function newestFetchedAt(quotes: QuoteMap): string | null {
  let newest: string | null = null
  for (const entry of quotes.values()) {
    if (!newest || entry.fetchedAt > newest) newest = entry.fetchedAt
  }
  return newest
}

interface FetchOutcome {
  key: string
  symbol: string
  entry: QuoteCacheEntry | null
  reason?: string
}

/**
 * Wählt den Endpunkt für eine Position.
 *
 * Zwei Achsen: ISIN oder Symbol — und ob die TTL des Dienstes gilt. Ohne
 * `force` liefert er innerhalb von sechs Stunden den Kurs aus seinem eigenen
 * Speicher; mit `force` beschafft er ihn live.
 */
function requestQuote(
  client: StockInfoClient,
  position: Position,
  force: boolean,
): Promise<QuoteResponse> {
  if (position.isin) {
    return force ? client.refreshByIsin(position.isin) : client.getQuoteByIsin(position.isin)
  }
  return force
    ? client.refreshBySymbol(position.symbol)
    : client.getQuoteBySymbol(position.symbol)
}

/** Holt den Kurs einer Position und macht aus einem Fehler ein Ergebnis. */
async function fetchOne(
  client: StockInfoClient,
  position: Position,
  force: boolean,
): Promise<FetchOutcome> {
  const key = quoteKey(position)
  try {
    const response = await requestQuote(client, position, force)
    return { key, symbol: position.symbol, entry: toQuoteCacheEntry(response) }
  } catch (error) {
    const reason = error instanceof ApiError ? error.detail : translate('notify.unknownError')
    return { key, symbol: position.symbol, entry: null, reason }
  }
}

/**
 * Führt `task` über alle `items` aus, aber höchstens `limit` gleichzeitig.
 * Wirft nie — Fehler müssen im Task selbst behandelt werden.
 *
 * @param items Eingabeliste.
 * @param limit Maximale Parallelität (>= 1).
 * @param task  Auszuführende Funktion je Element.
 * @returns Ergebnisse in der Reihenfolge der Eingabe.
 */
async function mapWithConcurrency<TItem, TResult>(
  items: TItem[],
  limit: number,
  task: (item: TItem) => Promise<TResult>,
): Promise<TResult[]> {
  const results = new Array<TResult>(items.length)
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      const item = items[index]
      if (item === undefined) continue
      results[index] = await task(item)
    }
  }

  const workerCount = Math.min(Math.max(limit, 1), items.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))

  return results
}

/*
 * Hot-Reload: Ohne diese Zeile behält der Browser beim Speichern die alte
 * Fassung des Stores. Neue Methoden fehlen dann — der Aufruf läuft ins Leere
 * und man sucht den Fehler im eigenen Code, obwohl nur ein Neuladen fehlt.
 */
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useQuotesStore, import.meta.hot))
}
