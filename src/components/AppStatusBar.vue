<script setup lang="ts">
import { computed, inject, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useApiStatusStore } from '@/stores/apiStatus'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { useRelativeTime } from '@/composables/useRelativeTime'
import { integer } from '@/domain/formatters'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'

/**
 * Schmale Zeile am unteren Rand — der Zustand der App auf einen Blick.
 *
 * Antwort auf eine wiederkehrende Frage: Sind die Zahlen, die ich gerade
 * ansehe, überhaupt aktuell? Steht die Gegenstelle? Welcher Stand läuft hier?
 * Das gehört an einen festen Platz, nicht verteilt über Kopfzeile,
 * Einstellungen und Konsole.
 *
 * Bewusst leise gehalten: Sie steht dauerhaft im Bild und darf mit den
 * eigentlichen Daten nicht um Aufmerksamkeit ringen.
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

const dotClass = computed(() => {
  switch (apiStatus.state) {
    case 'online':
      return 'bg-status-ok'
    case 'offline':
      return 'bg-status-out'
    case 'checking':
      return 'bg-status-near animate-pulse'
    default:
      return 'bg-ink-muted'
  }
})

/** Kurze Adresse ohne Schema — die volle steht in den Einstellungen. */
const host = computed(() => {
  const url = client?.url
  if (!url) return '—'
  try {
    return new URL(url).host
  } catch {
    return url
  }
})

const portfolioName = computed(() => portfolioStore.portfolio?.name ?? null)

const positionCount = computed(
  () => portfolioStore.positions.filter((position) => position.enabled).length,
)

/** Kurse, die die Gegenstelle nicht liefern konnte. */
const failureCount = computed(() => quotesStore.failures.length)

const version = __APP_VERSION__
</script>

<template>
  <footer
    class="sticky bottom-0 z-20 border-t border-edge bg-card/95 backdrop-blur
           px-4 md:px-6 py-1.5 text-[11px] text-ink-muted"
  >
    <div class="max-w-[1400px] mx-auto flex items-center gap-x-4 gap-y-1 flex-wrap">
      <!-- Links: Herkunft und was gerade im Depot steht. -->
      <span>
        <span class="font-medium text-ink-secondary">StockPortfolio</span>
        {{ t('status.poweredBy') }}
        <a
          href="https://www.mangolila.at/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-accent hover:opacity-80"
        >
          MangoLila
        </a>
      </span>

      <span class="hidden sm:inline opacity-40">·</span>

      <!--
        Der Depotname gehört hierher, sobald es mehr als eines gibt: Ohne ihn
        wäre jede Zahl der App mehrdeutig — man sähe nicht, worauf sie sich
        bezieht.
      -->
      <span class="truncate max-w-[14rem]">
        <span v-if="portfolioName" class="text-ink-secondary">{{ portfolioName }}</span>
        <span class="tabular-nums">
          {{ portfolioName ? ', ' : ''
          }}{{ t('units.positions', positionCount, { named: { count: integer(positionCount) } }) }}
        </span>
      </span>

      <span class="hidden sm:inline opacity-40">·</span>

      <!-- Das Alter der Kurse: Jede Kennzahl der App hängt daran. -->
      <span>
        {{ t('status.quotes') }}
        <span class="text-ink-secondary tabular-nums">
          {{ quotesStore.loading ? t('status.quotesLoading') : quoteAge }}
        </span>
      </span>

      <span v-if="failureCount > 0" class="text-status-out">
        {{
          t('status.quotesMissing', {
            quotes: t('units.quotes', failureCount, { named: { count: integer(failureCount) } }),
          })
        }}
      </span>

      <!-- Rechts: der technische Stand — Version und Zustand der Gegenstelle. -->
      <span class="ml-auto flex items-center gap-4">
        <span class="tabular-nums">{{ t('common.version', { version }) }}</span>

        <!--
          Anklickbar statt bloß informativ: Wer hier ein rotes Licht sieht, will
          als Nächstes wissen, woran es liegt — und genau das steht im
          Status-Tab.
        -->
        <button
          type="button"
          class="flex items-center gap-1.5 transition-colors hover:text-ink"
          :title="t('status.apiDetails', { state: stateLabel[apiStatus.state] })"
          @click="router.push('/settings')"
        >
          <span class="inline-block h-1.5 w-1.5 rounded-full shrink-0" :class="dotClass"></span>
          <span :class="apiStatus.state === 'offline' ? 'text-status-out' : ''">
            {{ host }}
          </span>
          <span v-if="apiStatus.version" class="opacity-60 tabular-nums">
            {{ apiStatus.version }}
          </span>
        </button>
      </span>
    </div>
  </footer>
</template>
