import { computed, inject, watch } from 'vue'
import { STOCK_INFO_CLIENT } from '@/api/client'
import { baseCurrencyOf, majorCurrency } from '@/domain/fx'
import { computeRebalancing, quoteFor } from '@/domain/rebalancing'
import { useFxStore } from '@/stores/fx'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { useSettingsStore } from '@/stores/settings'
import type { StockInfoClient } from '@/api/client'

/** Ein Bewertungsweg für Dashboard, Einstellungen und Handelsansicht. */
export function usePortfolioValuation() {
  const client = inject<StockInfoClient | null>(STOCK_INFO_CLIENT, null)
  const portfolio = usePortfolioStore()
  const quotes = useQuotesStore()
  const settings = useSettingsStore()
  const fx = useFxStore()
  const needed = computed(() => {
    const current = portfolio.portfolio
    if (!current) return []
    const target = baseCurrencyOf(current)
    return current.positions.filter(position => position.enabled && position.group !== 'cash')
      .map(position => quoteFor(position, quotes.quotes))
      .filter(quote => quote && majorCurrency(quote.currency) !== target)
      .map(quote => ({ base: majorCurrency(quote!.currency), target, fetchedAt: quote!.fetchedAt }))
  })
  /**
   * Holt die nötigen Devisenkurse. Ohne `force` bleibt ein Kurs zum selben
   * Kursstand erhalten, damit ein Ansichtswechsel StockInfo nicht erneut fragt.
   */
  async function loadFx(force = false): Promise<void> {
    if (!client) return
    // Je Währung ein Abruf; der Stempel umfasst alle Kurse dieser Währung.
    const stamps = new Map<string, { target: string; fetchedAt: string[] }>()
    for (const pair of needed.value) {
      const entry = stamps.get(pair.base) ?? { target: pair.target, fetchedAt: [] }
      entry.fetchedAt.push(pair.fetchedAt)
      stamps.set(pair.base, entry)
    }
    await Promise.all([...stamps].map(([base, entry]) =>
      fx.load(client, base, entry.target, force ? undefined : entry.fetchedAt.sort().join('|'))))
  }
  watch(() => `${portfolio.portfolio?.id}|${baseCurrencyOf(portfolio.portfolio)}|${needed.value.map(pair => `${pair.base}:${pair.fetchedAt}`).join('|')}`, () => loadFx(), { immediate: true })
  const result = computed(() => portfolio.portfolio
    ? computeRebalancing(portfolio.portfolio, quotes.quotes, settings.settings, new Date(), fx.rates)
    : null)
  /** „Erneut versuchen“: fragt StockInfo auch bei vorhandenem Kurs. */
  const retryFx = (): Promise<void> => loadFx(true)
  return { result, fx, loadFx, retryFx }
}
