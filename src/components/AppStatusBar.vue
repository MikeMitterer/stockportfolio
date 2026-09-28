<script setup lang="ts">
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'
import { UxStatusBar } from '@mmit/ux-foundation'
import { useApiStatusStore } from '@/stores/apiStatus'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { useRelativeTime } from '@/composables/useRelativeTime'
import { integer } from '@/domain/formatters'
import { baseCurrencyOf } from '@/domain/fx'
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
const aboutHref = computed(() => router.resolve({ path: '/settings', query: { tab: 'about' } }).href)

const apiStatus = useApiStatusStore()
const portfolioStore = usePortfolioStore()
const quotesStore = useQuotesStore()

const quoteAge = useRelativeTime(computed(() => quotesStore.lastRefreshAt))

/*
 * Geprüft wird nicht mehr hier, sondern in `App.vue`: Diese Zeile zeigt den
 * Zustand an, sie ermittelt ihn nicht. Der Unterschied wurde praktisch, als der
 * Ausfall auch gemeldet werden sollte — eine Meldung, die aus der Statuszeile
 * käme, hinge an einem Bauteil, das nur anzeigt.
 */

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
  return name ? `${name} (${baseCurrencyOf(portfolioStore.portfolio)}), ${count}` : count
})

/**
 * Alter der Kurse — jede Kennzahl der App hängt daran.
 *
 * `busy` und nicht `loading`: Letzteres setzt nur der Sammelabruf, nicht der
 * Einzel-Refresh im Drilldown. Die Zeile behauptete dort ein Alter, während
 * oben sichtbar geladen wurde — drei Anzeigen, zwei Meinungen.
 */
const dataAge = computed(() => {
  const age = quotesStore.busy ? t('status.quotesLoading') : quoteAge.value
  return `${t('status.quotes')} ${age}`
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
    :version="t('common.version', { version })"
    :backend-host="host"
    :backend-state="apiStatus.state"
    :backend-version="apiStatus.version ?? ''"
    :backend-state-label="t('status.apiDetails', { state: stateLabel[apiStatus.state] })"
    @backend-click="router.push({ path: '/settings', query: { tab: 'status' } })"
  >
    <template #left>
      <span class="status__separator status__separator--brand" aria-hidden="true">·</span>
      <a class="status__about" :href="aboutHref">{{ t('status.aboutLabel') }}</a>
      <span class="status__separator" aria-hidden="true">·</span>
      <NButton
        text
        tag="a"
        href="https://github.com/MikeMitterer/stockportfolio"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="t('status.repositoryLabel')"
        :title="t('status.repositoryLabel')"
      >
        <svg
          class="status__repository-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-1-2.7c3.3-.4 6.7-1.6 6.7-7.3A5.7 5.7 0 0 0 20.2 4a5.3 5.3 0 0 0-.1-4s-1.2-.4-4.1 1.5a13.4 13.4 0 0 0-7 0C6.1-.4 4.9 0 4.9 0a5.3 5.3 0 0 0-.1 4 5.7 5.7 0 0 0-1.5 4c0 5.7 3.4 6.9 6.7 7.3a3.4 3.4 0 0 0-1 2.7V22" />
        </svg>
      </NButton>
      <span v-if="context" class="status__separator" aria-hidden="true">·</span>
      <span v-if="context" class="status__context">{{ context }}</span>
      <span v-if="dataAge" class="status__separator status__separator--age" aria-hidden="true">·</span>
      <span v-if="dataAge">{{ dataAge }}</span>
      <span v-if="failures" class="status__failures">{{ failures }}</span>
    </template>
  </UxStatusBar>
</template>

<style scoped lang="scss">
.status {
  &__about {
    color: token(--text-bar-accent);
    font: inherit;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }
  &__repository-icon {
    inline-size: var(--font-base);
    block-size: var(--font-base);
    color: token(--text-bar-accent);
  }

  &__context,
  &__separator { color: token(--text-bar-secondary); }

  &__separator--brand,
  &__separator--age { @include below(sm) { display: none; } }

  &__failures { color: token(--status-out); }
}
</style>
