import { computed } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { baseCurrencyOf } from '@/domain/fx'
import { money } from '@/domain/formatters'

/** Depotbeträge folgen dem aktiven Depot; Originalkurse verwenden weiter money(). */
export function usePortfolioCurrency() {
  const portfolio = usePortfolioStore()
  const baseCurrency = computed(() => baseCurrencyOf(portfolio.portfolio))
  const formatMoney = (value: number, decimals = 0) => money(value, baseCurrency.value, decimals)
  const formatMoneyCents = (value: number) => formatMoney(value, 2)
  const formatMoneySigned = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatMoney(Math.abs(value))}`
  return { baseCurrency, formatMoney, formatMoneyCents, formatMoneySigned }
}
