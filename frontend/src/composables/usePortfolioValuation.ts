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
  async function loadFx(): Promise<void> {
    if (!client) return
    const pairs = new Map(needed.value.map(pair => [pair.base, pair]))
    await Promise.all([...pairs.values()].map(pair => fx.load(client, pair.base, pair.target)))
  }
  watch(() => `${portfolio.portfolio?.id}|${baseCurrencyOf(portfolio.portfolio)}|${needed.value.map(pair => `${pair.base}:${pair.fetchedAt}`).join('|')}`, loadFx, { immediate: true })
  const result = computed(() => portfolio.portfolio
    ? computeRebalancing(portfolio.portfolio, quotes.quotes, settings.settings, new Date(), fx.rates)
    : null)
  return { result, fx, loadFx }
}
