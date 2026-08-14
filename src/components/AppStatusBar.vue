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

/** Zustand der Gegenstelle — färbt Punkt und Adresse. */
const dotState = computed(() => apiStatus.state)

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
  <footer class="statusbar">
    <div class="statusbar__inner">
      <!-- Links: Herkunft und was gerade im Depot steht. -->
      <span>
        <span class="statusbar__app">StockPortfolio</span>
        {{ t('status.poweredBy') }}
        <a
          href="https://www.mangolila.at/"
          target="_blank"
          rel="noopener noreferrer"
          class="statusbar__origin"
        >
          MangoLila
        </a>
      </span>

      <span class="statusbar__dot-separator">·</span>

      <!--
        Der Depotname gehört hierher, sobald es mehr als eines gibt: Ohne ihn
        wäre jede Zahl der App mehrdeutig — man sähe nicht, worauf sie sich
        bezieht.
      -->
      <span class="statusbar__context">
        <span v-if="portfolioName" class="statusbar__strong">{{ portfolioName }}</span>
        <span class="tabular-nums">
          {{ portfolioName ? ', ' : ''
          }}{{ t('units.positions', positionCount, { named: { count: integer(positionCount) } }) }}
        </span>
      </span>

      <span class="statusbar__dot-separator">·</span>

      <!-- Das Alter der Kurse: Jede Kennzahl der App hängt daran. -->
      <span>
        {{ t('status.quotes') }}
        <span class="statusbar__strong tabular-nums">
          {{ quotesStore.loading ? t('status.quotesLoading') : quoteAge }}
        </span>
      </span>

      <span v-if="failureCount > 0" class="statusbar__failures">
        {{
          t('status.quotesMissing', {
            quotes: t('units.quotes', failureCount, { named: { count: integer(failureCount) } }),
          })
        }}
      </span>

      <!-- Rechts: der technische Stand — Version und Zustand der Gegenstelle. -->
      <span class="statusbar__tech">
        <span class="tabular-nums">{{ t('common.version', { version }) }}</span>

        <!--
          Anklickbar statt bloß informativ: Wer hier ein rotes Licht sieht, will
          als Nächstes wissen, woran es liegt — und genau das steht im
          Status-Tab.
        -->
        <button
          type="button"
          class="statusbar__api"
          :title="t('status.apiDetails', { state: stateLabel[apiStatus.state] })"
          @click="router.push('/settings')"
        >
          <span class="statusbar__light" :class="`statusbar__light--${dotState}`"></span>
          <span :class="{ 'statusbar__offline': dotState === 'offline' }">{{ host }}</span>
          <span v-if="apiStatus.version" class="statusbar__api-version tabular-nums">
            {{ apiStatus.version }}
          </span>
        </button>
      </span>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.statusbar {
  position: sticky;
  bottom: 0;
  z-index: 20;
  padding: 0.375rem var(--space-4);
  border-top: 1px solid token(--border-default);
  background-color: token(--surface-card, 0.95);
  backdrop-filter: blur(8px);
  font-size: 0.6875rem;
  color: token(--text-muted);

  @include up(md) {
    padding-right: var(--space-6);
    padding-left: var(--space-6);
  }

  /* Darf umbrechen: Auf schmalen Schirmen lieber zweizeilig als beschnitten. */
  &__inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-4);
    max-width: 1400px;
    margin: 0 auto;
  }

  &__app {
    font-weight: 500;
    color: token(--text-secondary);
  }

  &__origin {
    color: token(--accent);

    &:hover { opacity: 0.8; }
  }

  &__strong {
    color: token(--text-secondary);
  }

  &__context {
    max-width: 14rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__dot-separator {
    display: none;
    opacity: 0.4;

    @include up(sm) { display: inline; }
  }

  &__failures {
    color: token(--status-out);
  }

  &__tech {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-left: auto;
  }

  &__api {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    transition: color 0.15s ease;

    &:hover { color: token(--text-primary); }
  }

  &__light {
    display: inline-block;
    flex-shrink: 0;
    width: 0.375rem;
    height: 0.375rem;
    border-radius: var(--radius-full);
    background-color: token(--text-muted);

    &--online { background-color: token(--status-ok); }
    &--offline { background-color: token(--status-out); }
    &--checking {
      background-color: token(--status-near);
      animation: statusbar-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  }

  &__offline {
    color: token(--status-out);
  }

  &__api-version {
    opacity: 0.6;
  }
}

@keyframes statusbar-pulse {
  50% { opacity: 0.5; }
}
</style>
