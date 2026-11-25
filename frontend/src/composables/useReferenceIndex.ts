/**
 * Referenzindex des Gesamtwert-Diagramms (T-143): Eingabe prüfen, Verlauf
 * laden und sagen, warum keine Vergleichslinie entsteht.
 *
 * Der Index ist ein Papier aus StockInfo, das nicht im Depot liegen muss.
 * Festgelegt wird er per ISIN oder Ticker; geprüft wird gegen den Katalog
 * (`/instruments`) und einen Kursabruf — dieselbe Bedingung wie bei einer
 * neuen Depotposition.
 */
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { StockInfoClient } from '@/api/stockinfo/client'
import { describeFailure } from '@/api/stockinfo/errors'
import type { InstrumentSummary } from '@/api/stockinfo/types'
import { majorCurrency } from '@/domain/fx'
import type { HistoryPoint } from '@/domain/sparkline'
import { useHistoryStore } from '@/stores/history'
import { useSettingsStore } from '@/stores/settings'
import type { ReferenceIndex } from '@/types/portfolio'

/** Der Vergleich braucht den ganzen Verlauf; das Diagramm schneidet daraus zu. */
const REFERENCE_PERIOD = 'max' as const

/** ISIN: zwei Buchstaben Land, neun alphanumerische Zeichen, eine Prüfziffer. */
const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/

/** Ergebnis der Prüfung einer Eingabe. */
export type ReferenceResolution =
  | { ok: true; value: ReferenceIndex }
  | { ok: false; reason: 'empty' | 'unknown' | 'ambiguous' | 'quote'; detail?: string }

/**
 * Sucht die Listings im Katalog, die zur Eingabe passen.
 *
 * Eine ISIN trifft alle Listings dieses Papiers; welches davon kursgebend ist,
 * entscheidet StockInfo beim Abruf über die ISIN — wie bei einer Position mit
 * ISIN. Ein Ticker trifft das vollständige Symbol (`VWCE.DE`) oder das Kürzel
 * eines börsennotierten Listings (`VWCE`); das kann mehrere Börsen treffen.
 *
 * @returns `kind` sagt, wie abgerufen wird; `matches` die passenden Listings.
 */
export function matchReferenceInput(
  input: string,
  catalogue: InstrumentSummary[],
): { kind: 'isin' | 'symbol'; query: string; matches: InstrumentSummary[] } {
  const query = input.trim().toUpperCase()
  if (ISIN_PATTERN.test(query)) {
    return {
      kind: 'isin',
      query,
      matches: catalogue.filter((entry) => entry.isin?.toUpperCase() === query),
    }
  }
  const matches = catalogue.filter(
    (entry) =>
      entry.symbol.toUpperCase() === query ||
      (entry.identity.kind === 'listed' && entry.identity.ticker.toUpperCase() === query),
  )
  const unique = [...new Map(matches.map((entry) => [entry.listing_id, entry])).values()]
  return { kind: 'symbol', query, matches: unique }
}

/**
 * Prüft eine Eingabe gegen Katalog und Kursabruf.
 *
 * Unbekannt ist, was der Katalog nicht führt; mehrdeutig ein Ticker, der
 * mehrere Listings trifft. Erst ein erfolgreicher Kursabruf liefert Namen und
 * Währung, die das Diagramm braucht.
 */
export async function resolveReferenceIndex(
  client: StockInfoClient,
  catalogue: InstrumentSummary[],
  input: string,
): Promise<ReferenceResolution> {
  if (!input.trim()) return { ok: false, reason: 'empty' }
  const { kind, query, matches } = matchReferenceInput(input, catalogue)
  if (matches.length === 0) return { ok: false, reason: 'unknown', detail: query }
  if (kind === 'symbol' && matches.length > 1) {
    return {
      ok: false,
      reason: 'ambiguous',
      detail: matches.map((entry) => entry.symbol).join(', '),
    }
  }
  try {
    const quote =
      kind === 'isin'
        ? await client.getQuoteByIsin(query)
        : await client.getQuoteBySymbol(matches[0]!.symbol)
    return {
      ok: true,
      value: {
        isin: kind === 'isin' ? query : null,
        symbol: quote.symbol,
        name: quote.name || quote.symbol,
        currency: quote.currency,
      },
    }
  } catch (cause) {
    return { ok: false, reason: 'quote', detail: describeFailure(cause) }
  }
}

/** Was das Diagramm zum Referenzindex braucht. */
export interface ChartReference {
  name: string
  /** Verlauf in Depotwährung; leer, wenn keiner vorliegt oder keiner passt. */
  points: HistoryPoint[]
}

/**
 * Referenzindex für das Diagramm eines Depots.
 *
 * @param client       StockInfo-Client; ohne ihn bleibt es beim Zwischenspeicher.
 * @param baseCurrency Depotwährung — der Index muss in ihr notieren.
 */
export function useReferenceIndex(
  client: StockInfoClient | null,
  baseCurrency: ComputedRef<string>,
) {
  const { t } = useI18n()
  const settingsStore = useSettingsStore()
  const historyStore = useHistoryStore()

  const selected = computed(() => settingsStore.settings.referenceIndex)

  /**
   * Notiert der Index in einer anderen Währung als das Depot?
   *
   * Historische Wechselkurse liefert StockInfo nicht (`/fx` kennt nur den
   * aktuellen Kurs). Mit dem heutigen Kurs umgerechnet stimmte die Höhe, aber
   * der Verlauf verschwiege jede Währungsbewegung — die Linie wäre falsch.
   */
  const currencyMismatch = computed(
    () => !!selected.value && majorCurrency(selected.value.currency) !== baseCurrency.value,
  )

  const series = computed(() =>
    selected.value ? historyStore.get(selected.value, REFERENCE_PERIOD) : null,
  )

  const loading = computed(() => series.value?.loading ?? false)

  const reference = computed<ChartReference | null>(() => {
    if (!selected.value) return null
    return {
      name: selected.value.name,
      points: currencyMismatch.value ? [] : (series.value?.points ?? []),
    }
  })

  /** Hinweis statt Linie — oder `null`, wenn es nichts zu sagen gibt. */
  const note = computed<string | null>(() => {
    const index = selected.value
    if (!index) return null
    if (currencyMismatch.value) {
      return t('referenceIndex.currencyMismatch', {
        name: index.name,
        currency: majorCurrency(index.currency),
        base: baseCurrency.value,
      })
    }
    if (!series.value || series.value.loading) return null
    if (series.value.points.length === 0) return t('referenceIndex.noHistory', { name: index.name })
    return null
  })

  /** Lädt den Verlauf, sofern ein Index gesetzt ist und er in Depotwährung notiert. */
  async function load(): Promise<void> {
    if (!selected.value || currencyMismatch.value) return
    await historyStore.ensure(client, selected.value, REFERENCE_PERIOD)
  }

  return { selected, reference, note, loading, load }
}
