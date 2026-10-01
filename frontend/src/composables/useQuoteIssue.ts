/** Derselbe konkrete Kursfehler in Tabelle, Detail und Mobilansicht. */
import { useI18n } from 'vue-i18n'
import { useQuotesStore } from '@/stores/quotes'
import { quoteKey, type PositionResult } from '@/domain/rebalancing'

export function useQuoteIssue(): (row: PositionResult) => string {
  const store = useQuotesStore()
  const { t } = useI18n()
  return (row) => {
    const reason = store.failures.find((failure) => failure.key === quoteKey(row.position))?.reason ?? ''
    return [row.quote?.stale ? t('errors.staleQuote') : '', reason].filter(Boolean).join(' ')
  }
}
