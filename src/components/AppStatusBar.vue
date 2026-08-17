<script setup lang="ts">
import { computed, inject, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { UxStatusBar } from '@mmit/ux-foundation'
import { useApiStatusStore } from '@/stores/apiStatus'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { useRelativeTime } from '@/composables/useRelativeTime'
import { integer } from '@/domain/formatters'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'

/**
 * Die Statuszeile dieser App.
 *
 * Aussehen und Aufbau liefert das Fundament (`UxStatusBar`). Hier bleibt die
 * Verdrahtung: welche Stores gefragt werden, wie die Angaben heißen und wohin
 * der Klick auf die Gegenstelle führt.
 *
 * Die Trennung ist nicht kosmetisch. Ein Paket kennt weder Stores noch einen
 * Message-Katalog — „Kurse vor 4 Std" weiß nur diese App. Umgekehrt weiß die
 * App nicht, wie eine Statuszeile auszusehen hat; das ist über alle Apps
 * dasselbe.
 */

const { t } = useI18n()

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT) ?? null
const router = useRouter()

const apiStatus = useApiStatusStore()
const portfolioStore = usePortfolioStore()
const quotesStore = useQuotesStore()

const quoteAge = useRelativeTime(computed(() => quotesStore.lastRefreshAt))

onMounted(() => {
  // Nur, wenn noch niemand geprüft hat — die Einstellungen tun dasselbe.
  if (apiStatus.state === 'unknown') void apiStatus.check(client)
})

const stateLabel = computed<Record<string, string>>(() => ({
  unknown: t('status.apiUnknown'),
  checking: t('status.apiChecking'),
  online: t('status.apiOnline'),
  offline: t('status.apiOffline'),
}))

/** Kurze Adresse ohne Schema — die volle steht in den Einstellungen. */
const host = computed(() => {
  const url = client?.url
  if (!url) return ''
  try {
    return new URL(url).host
  } catch {
    return url
  }
})

/** Nur aktive Positionen — ausgeblendete zählen nicht mit. */
const positionCount = computed(
  () => portfolioStore.positions.filter((position) => position.enabled).length,
)

const version = __APP_VERSION__

/**
 * Depotname und Größe in einem Zug.
 *
 * Sobald es mehr als ein Depot gibt, ist der Name Pflicht: Ohne ihn wäre jede
 * Zahl der App mehrdeutig — man sähe nicht, worauf sie sich bezieht.
 */
const context = computed(() => {
  const name = portfolioStore.portfolio?.name ?? ''
  const count = t('units.positions', positionCount.value, {
    named: { count: integer(positionCount.value) },
  })
  return name ? `${name}, ${count}` : count
})

/** Alter der Kurse — jede Kennzahl der App hängt daran. */
const dataAge = computed(() => {
  const wert = quotesStore.loading ? t('status.quotesLoading') : quoteAge.value
  return `${t('status.quotes')} ${wert}`
})

const failureCount = computed(() => quotesStore.failures.length)

const failures = computed(() =>
  failureCount.value > 0
    ? t('status.quotesMissing', {
        quotes: t('units.quotes', failureCount.value, {
          named: { count: integer(failureCount.value) },
        }),
      })
    : '',
)
</script>

<template>
  <UxStatusBar
    app-name="StockPortfolio"
    :powered-by-label="t('status.poweredBy')"
    origin-name="MangoLila"
    origin-href="https://www.mangolila.at/"
    :context="context"
    :data-age="dataAge"
    :failures="failures"
    :version="t('common.version', { version })"
    :backend-host="host"
    :backend-state="apiStatus.state"
    :backend-version="apiStatus.version ?? ''"
    :backend-state-label="t('status.apiDetails', { state: stateLabel[apiStatus.state] })"
    @backend-click="router.push('/settings')"
  />
</template>
