<script setup lang="ts">
import { computed, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApiStatusStore } from '@/stores/apiStatus'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { useRelativeTime } from '@/composables/useRelativeTime'
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

const STATE_LABEL: Record<string, string> = {
  unknown: 'API ungeprüft',
  checking: 'API wird geprüft',
  online: 'API erreichbar',
  offline: 'API nicht erreichbar',
}

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
        powered by
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

      <span class="tabular-nums">
        {{ positionCount }} {{ positionCount === 1 ? 'Position' : 'Positionen' }}
      </span>

      <span class="hidden sm:inline opacity-40">·</span>

      <!-- Das Alter der Kurse: Jede Kennzahl der App hängt daran. -->
      <span>
        Kurse
        <span class="text-ink-secondary tabular-nums">
          {{ quotesStore.loading ? 'werden geladen …' : quoteAge }}
        </span>
      </span>

      <span v-if="failureCount > 0" class="text-status-out">
        {{ failureCount }} Kurs{{ failureCount === 1 ? '' : 'e' }} fehlen
      </span>

      <!-- Rechts: der technische Stand — Version und Zustand der Gegenstelle. -->
      <span class="ml-auto flex items-center gap-4">
        <span class="tabular-nums">v{{ version }}</span>

        <!--
          Anklickbar statt bloß informativ: Wer hier ein rotes Licht sieht, will
          als Nächstes wissen, woran es liegt — und genau das steht im
          Status-Tab.
        -->
        <button
          type="button"
          class="flex items-center gap-1.5 transition-colors hover:text-ink"
          :title="`${STATE_LABEL[apiStatus.state]} — Details in den Einstellungen`"
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
