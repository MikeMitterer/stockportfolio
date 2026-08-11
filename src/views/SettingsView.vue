<script setup lang="ts">
import { computed, inject, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NButtonGroup,
  NCard,
  NInputNumber,
  NSelect,
  NTabPane,
  NTabs,
} from 'naive-ui'
import BackupPanel from '@/components/BackupPanel.vue'
import InfoHint from '@/components/InfoHint.vue'
import PortfolioManager from '@/components/PortfolioManager.vue'
import ExternalLinkEditor from '@/components/ExternalLinkEditor.vue'
import { eur } from '@/domain/formatters'
import { computeRebalancing, resolveSecurityBuffer } from '@/domain/rebalancing'
import { useSettingsStore } from '@/stores/settings'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { useInstrumentsStore } from '@/stores/instruments'
import { useThemeStore } from '@/stores/theme'
import { LOCALE_IDS, LOCALES, useLocaleStore } from '@/stores/locale'
import { THEME_IDS, THEMES } from '@/theme/themes'
import { useApiStatusStore } from '@/stores/apiStatus'
import { useRelativeTime } from '@/composables/useRelativeTime'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const portfolioStore = usePortfolioStore()
const quotesStore = useQuotesStore()
const instrumentsStore = useInstrumentsStore()
const themeStore = useThemeStore()
const localeStore = useLocaleStore()

/** Gesamtvermögen — nur als Bezugsgröße für die Puffer-Vorschau. */
const total = computed(() => {
  const portfolio = portfolioStore.portfolio
  if (!portfolio) return 0
  return computeRebalancing(portfolio, quotesStore.quotes, settingsStore.settings).total
})

onMounted(async () => {
  if (!portfolioStore.loaded) await portfolioStore.load()
  if (!settingsStore.loaded) await settingsStore.load(portfolioStore.portfolio?.id ?? '')
  await quotesStore.hydrate()
  // Ohne den Katalog, aber mit der Whitelist — die gehört in die Sicherung.
  await instrumentsStore.hydrateAllowlist()
  // Ungefragt prüfen: Wer diese Seite öffnet, will den Zustand sehen, nicht
  // erst einen Knopf suchen.
  await api.check(client)
})

async function setLowerBand(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.setBands({ ...settingsStore.settings.bands, lowerPercent: value })
}

async function setUpperBand(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.setBands({ ...settingsStore.settings.bands, upperPercent: value })
}

async function setSecurityBufferValue(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.patch({
    securityBuffer: { ...settingsStore.settings.securityBuffer, value },
  })
}

/**
 * Wechselt die Einheit und rechnet den Wert um.
 *
 * Die Zahl unverändert stehen zu lassen wäre falsch: Aus 170.000 € würden
 * 170.000 % — ein Wert, den niemand gemeint hat. Umgerechnet bleibt der Puffer
 * im Moment des Wechsels derselbe Betrag und skaliert ab dann mit dem Depot.
 */
async function setSecurityBufferMode(mode: 'percent' | 'absolute'): Promise<void> {
  const current = settingsStore.settings.securityBuffer
  if (current.mode === mode) return

  const euro = resolveSecurityBuffer(current, total.value)
  const value =
    mode === 'percent'
      // Ohne Gesamtvermögen gibt es keinen Bezug — dann lieber zurück auf null
      // als eine Division durch null.
      ? total.value > 0
        ? Number(((euro * 100) / total.value).toFixed(2))
        : 0
      : Math.round(euro)

  await settingsStore.patch({ securityBuffer: { mode, value } })
}

const bufferModeOptions = computed(() => [
  { label: t('settings.bufferPercent'), value: 'percent' as const },
  { label: t('settings.bufferAbsolute'), value: 'absolute' as const },
])

/** Puffer in Euro — bei Prozent-Modus aus dem aktuellen Gesamtwert. */
const securityBufferEuro = computed(() =>
  resolveSecurityBuffer(settingsStore.settings.securityBuffer, total.value),
)

async function setNotificationSeconds(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.patch({
    ui: { ...settingsStore.settings.ui, notificationSeconds: value },
  })
}

const themes = THEME_IDS.map((id) => THEMES[id])
const locales = LOCALE_IDS.map((id) => LOCALES[id])

// ─── Status der Gegenstelle ─────────────────────────────────────────────────

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT) ?? null
const api = useApiStatusStore()
const apiCheckedAgo = useRelativeTime(computed(() => api.checkedAt))

/** Die Adresse aus `VITE_STOCKINFO_API_URL`, wie sie beim Bauen gesetzt wurde. */
const apiUrl = computed(() => client?.url ?? '—')

const apiStateLabel = computed<Record<string, string>>(() => ({
  unknown: t('settings.apiStates.unknown'),
  checking: t('settings.apiStates.checking'),
  online: t('settings.apiStates.online'),
  offline: t('settings.apiStates.offline'),
}))
</script>

<template>
  <div class="max-w-[1400px] mx-auto px-6 py-8">
    <h1 class="text-2xl font-semibold mb-4">{{ t('views.settingsTitle') }}</h1>

    <!--
      Gegliedert statt gestapelt: Rechenvorgaben, Aussehen und Verweise haben
      nichts miteinander zu tun; untereinander ergaben sie eine lange Seite,
      auf der man scrollen musste, um überhaupt zu sehen, was es gibt.
    -->
    <NTabs type="line" animated>
      <NTabPane name="calc" :tab="t('settings.tabs.calc')">
        <!-- Zwei Spalten: beide Karten sind schmal, nebeneinander spart Höhe. -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          <NCard :bordered="false" class="!bg-card">
            <template #header>
              <span class="inline-flex items-center gap-1.5 text-sm font-medium">
              {{ t('settings.bandsHeading') }}
              <InfoHint :text="t('hints.bands')" anchor="bands" />
            </span>
            </template>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <label class="flex flex-col gap-1 text-sm">
                <span class="text-ink-muted">{{ t('bands.lower') }} (%)</span>
                <NInputNumber
                  :value="settingsStore.settings.bands.lowerPercent"
                  :min="0"
                  :max="100"
                  :step="1"
                  :precision="1"
                  @update:value="setLowerBand"
                />
                <span class="text-xs text-ink-muted">
                  {{ t('settings.lowerHint') }}
                </span>
              </label>

              <label class="flex flex-col gap-1 text-sm">
                <span class="text-ink-muted">{{ t('bands.upper') }} (%)</span>
                <NInputNumber
                  :value="settingsStore.settings.bands.upperPercent"
                  :min="0"
                  :max="100"
                  :step="1"
                  :precision="1"
                  @update:value="setUpperBand"
                />
                <span class="text-xs text-ink-muted">
                  {{ t('settings.upperHint') }}
                </span>
              </label>
            </div>
          </NCard>

          <NCard :bordered="false" class="!bg-card">
            <template #header>
              <span class="text-sm font-medium">{{ t('settings.metricsHeading') }}</span>
            </template>

            <div class="grid grid-cols-1 gap-6">
              <!--
              Zwei Lesarten des Puffers, beide gültig: ein Notgroschen ist ein
              fester Betrag und wächst nicht mit dem Depot; ein Liquiditätsanteil
              ist ein Prozentsatz. Statt eine Auslegung zu erzwingen, steht die
              Wahl hier — mit dem daraus folgenden Euro-Betrag als Kontrolle.
            -->
              <label class="flex flex-col gap-1 text-sm">
                <span class="inline-flex items-center gap-1.5 text-ink-muted">
              {{ t('settings.securityBuffer') }}
              <InfoHint :text="t('hints.securityBuffer')" anchor="reserve" />
            </span>
                <div class="flex gap-2">
                  <NInputNumber
                    class="flex-1"
                    :value="settingsStore.settings.securityBuffer.value"
                    :min="0"
                    :step="settingsStore.settings.securityBuffer.mode === 'percent' ? 1 : 1000"
                    @update:value="setSecurityBufferValue"
                  />
                  <NSelect
                    class="w-44 shrink-0"
                    :value="settingsStore.settings.securityBuffer.mode"
                    :options="bufferModeOptions"
                    @update:value="setSecurityBufferMode"
                  />
                </div>
                <span class="text-xs text-ink-muted">
                  <template v-if="settingsStore.settings.securityBuffer.value === 0">
                    {{ t('settings.bufferUnset') }}
                  </template>
                  <template v-else>
                    {{ t('settings.bufferEquals', { amount: eur(securityBufferEuro) }) }}
                  </template>
                </span>
              </label>

              <!--
              Meldungen sind Zustände, keine Ereignisse: Sie verschwinden ohnehin,
              sobald ihre Ursache behoben ist. Der Zähler beendet nur das Warten
              darauf — beim Eintippen von Stückzahlen stand sonst dauerhaft ein
              Kasten im Weg.
            -->
              <label class="flex flex-col gap-1 text-sm">
                <span class="text-ink-muted">{{ t('settings.notificationSeconds') }}</span>
                <NInputNumber
                  :value="settingsStore.settings.ui.notificationSeconds"
                  :min="0"
                  :max="120"
                  :step="1"
                  @update:value="setNotificationSeconds"
                />
                <span class="text-xs text-ink-muted">
                  <template v-if="settingsStore.settings.ui.notificationSeconds === 0">
                    {{ t('settings.notificationKeep') }}
                  </template>
                  <template v-else>
                    {{ t('settings.notificationAuto') }}
                  </template>
                </span>
              </label>
            </div>
          </NCard>
        </div>
      </NTabPane>

      <NTabPane name="links" :tab="t('settings.tabs.links')">
        <NCard :bordered="false" class="!bg-card">
          <template #header>
            <span class="text-sm font-medium">{{ t('settings.linksHeading') }}</span>
          </template>

          <ExternalLinkEditor
            :links="settingsStore.settings.links"
            @update="settingsStore.setLinks"
            @reset="settingsStore.resetLinks"
          />
        </NCard>
      </NTabPane>

      <NTabPane name="theme" :tab="t('settings.tabs.theme')">
        <NCard :bordered="false" class="!bg-card">
          <template #header>
            <span class="text-sm font-medium">{{ t('settings.themeHeading') }}</span>
          </template>

          <!--
            Kacheln statt Auswahlliste: Ein Theme wählt man nach dem Aussehen,
            nicht nach dem Namen. Die Vorschau zeigt Fläche, Karte, Text und
            Akzentfarbe — dieselben vier Farben, die die Oberfläche prägen.
          -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              v-for="theme in themes"
              :key="theme.id"
              type="button"
              class="flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors"
              :class="
                themeStore.current === theme.id
                  ? 'border-accent'
                  : 'border-edge hover:border-ink-muted'
              "
              :aria-pressed="themeStore.current === theme.id"
              @click="themeStore.setTheme(theme.id)"
            >
              <span
                class="flex h-12 items-center gap-1.5 rounded-md px-2"
                :style="{ backgroundColor: theme.preview.page }"
              >
                <span
                  class="h-8 flex-1 rounded"
                  :style="{ backgroundColor: theme.preview.card }"
                ></span>
                <span
                  class="h-8 w-2 rounded"
                  :style="{ backgroundColor: theme.preview.ink }"
                ></span>
                <span
                  class="h-8 w-4 rounded"
                  :style="{ backgroundColor: theme.preview.accent }"
                ></span>
              </span>

              <span class="flex items-center gap-2">
                <span class="text-sm font-medium">{{ t(`settings.themeNames.${theme.id}`) }}</span>
                <span
                  v-if="themeStore.current === theme.id"
                  class="text-[10px] uppercase tracking-wide text-accent"
                >
                  {{ t('settings.themeActive') }}
                </span>
              </span>
              <span class="text-xs text-ink-muted leading-tight">
                {{ t(`settings.themeHints.${theme.id}`) }}
              </span>
            </button>
          </div>
        </NCard>
      </NTabPane>

      <NTabPane name="data" :tab="t('settings.tabs.data')">
        <div class="flex flex-col gap-4">
          <NCard :bordered="false" class="!bg-card">
            <template #header>
              <span class="text-sm font-medium">{{ t('portfolios.heading') }}</span>
            </template>

            <PortfolioManager />
          </NCard>

          <NCard :bordered="false" class="!bg-card">
            <template #header>
              <span class="text-sm font-medium">{{ t('backup.heading') }}</span>
            </template>

            <BackupPanel />
          </NCard>
        </div>
      </NTabPane>

      <NTabPane name="language" :tab="t('settings.tabs.language')">
        <NCard :bordered="false" class="!bg-card">
          <template #header>
            <span class="text-sm font-medium">{{ t('settings.languageHeading') }}</span>
          </template>

          <div class="flex flex-col gap-2">
            <NButtonGroup size="small">
              <NButton
                v-for="entry in locales"
                :key="entry.id"
                :type="entry.id === localeStore.current ? 'primary' : 'default'"
                :secondary="entry.id !== localeStore.current"
                @click="localeStore.setLocale(entry.id)"
              >
                {{ entry.label }}
              </NButton>
            </NButtonGroup>
            <span class="text-xs text-ink-muted leading-relaxed max-w-2xl">
              {{ t('settings.languageHint') }}
            </span>
          </div>
        </NCard>
      </NTabPane>

      <NTabPane name="status" :tab="t('settings.tabs.status')">
        <NCard :bordered="false" class="!bg-card">
          <template #header>
            <div class="flex items-center justify-between gap-4">
              <span class="text-sm font-medium">{{ t('settings.apiHeading') }}</span>
              <NButton
                size="small"
                secondary
                :loading="api.state === 'checking'"
                @click="api.check(client)"
              >
                {{ t('settings.apiRecheck') }}
              </NButton>
            </div>
          </template>

          <dl class="grid grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)] gap-x-6 gap-y-3 text-sm">
            <dt class="text-ink-muted">{{ t('settings.apiAddress') }}</dt>
            <dd class="break-all">
              <!--
                Im Klartext und anklickbar: Im Container entscheidet sich beim
                Bauen, welches Backend das Abbild anspricht — das sieht man
                sonst nirgends.
              -->
              <a
                :href="apiUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-accent hover:opacity-80"
              >
                {{ apiUrl }}
              </a>
            </dd>

            <dt class="text-ink-muted">{{ t('settings.apiState') }}</dt>
            <dd class="flex items-center gap-2">
              <span
                class="inline-block h-2 w-2 rounded-full shrink-0"
                :class="{
                  'bg-status-ok': api.state === 'online',
                  'bg-status-out': api.state === 'offline',
                  'bg-ink-muted': api.state !== 'online' && api.state !== 'offline',
                }"
                aria-hidden="true"
              ></span>
              <span
                :class="
                  api.state === 'online'
                    ? 'text-status-ok'
                    : api.state === 'offline'
                      ? 'text-status-out'
                      : 'text-ink-muted'
                "
              >
                {{ apiStateLabel[api.state] }}
              </span>
              <span v-if="api.status" class="text-ink-muted">
                {{ t('settings.apiReports', { status: api.status }) }}
              </span>
            </dd>

            <template v-if="api.version">
              <dt class="text-ink-muted">{{ t('settings.apiVersion') }}</dt>
              <dd class="tabular-nums">{{ api.version }}</dd>
            </template>

            <template v-if="api.latencyMs !== null">
              <dt class="text-ink-muted">{{ t('settings.apiLatency') }}</dt>
              <dd class="tabular-nums">{{ t('settings.apiLatencyUnit', { ms: api.latencyMs }) }}</dd>
            </template>

            <template v-if="api.checkedAt">
              <dt class="text-ink-muted">{{ t('settings.apiChecked') }}</dt>
              <dd class="text-ink-secondary">{{ apiCheckedAgo }}</dd>
            </template>

            <template v-if="api.error">
              <dt class="text-ink-muted">{{ t('settings.apiReason') }}</dt>
              <dd class="text-status-out">{{ api.error }}</dd>
            </template>
          </dl>

          <p v-if="api.state === 'offline'" class="mt-4 text-xs text-ink-muted leading-relaxed">
            {{ t('settings.apiOfflineHint') }}
          </p>
        </NCard>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
/*
 * Status ganz nach rechts, abgesetzt von den übrigen Reitern.
 *
 * Die drei linken sind zum Einstellen da, Status ist zum Nachsehen — der
 * Abstand macht den Unterschied sichtbar, statt ihn nur in die Reihenfolge
 * zu legen.
 *
 * `nth-last-child(2)`, nicht `last-of-type`: Naive UI hängt hinter den
 * letzten Reiter noch ein `.n-tabs-scroll-padding` — ebenfalls ein `div`,
 * auf das `last-of-type` gezielt hätte.
 */
:deep(.n-tabs-wrapper) {
  width: 100%;
}

:deep(.n-tabs-tab-wrapper:nth-last-child(2)) {
  margin-left: auto;
}
</style>
