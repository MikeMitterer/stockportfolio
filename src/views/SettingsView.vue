<script setup lang="ts">
import { computed, inject, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NButtonGroup,
  NCard,
  NDatePicker,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSpace,
  NTabPane,
  NTabs,
} from 'naive-ui'
import BackupPanel from '@/components/BackupPanel.vue'
import AmountSettingField from '@/components/AmountSettingField.vue'
import InfoHint from '@/components/InfoHint.vue'
import PortfolioManager from '@/components/PortfolioManager.vue'
import ExternalLinkEditor from '@/components/ExternalLinkEditor.vue'
import { shortDate } from '@/domain/formatters'
import { computeRebalancing } from '@/domain/rebalancing'
import {
  REBALANCING_TRIGGERS,
  daysUntilDue,
  nextDueDate,
  usesBands,
  usesCalendar,
} from '@/domain/schedule'
import { useSettingsStore } from '@/stores/settings'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { useInstrumentsStore } from '@/stores/instruments'
import { useThemeStore } from '@/stores/theme'
import { LOCALE_IDS, LOCALES, useLocaleStore } from '@/stores/locale'
import { HISTORY_PERIODS, HISTORY_PERIOD_INFO } from '@/domain/historyPeriod'
import type { AmountSetting, HistoryPeriod, RebalancingTrigger } from '@/types/portfolio'
import { THEME_IDS, THEMES } from '@/theme/themes'
import { useApiStatusStore } from '@/stores/apiStatus'
import { useRelativeTime } from '@/composables/useRelativeTime'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

/** Namen der Reiter — Reihenfolge wie in der Anzeige. */
const SETTINGS_TABS = ['calc', 'links', 'theme', 'data', 'notifications', 'language', 'status']
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

const triggerOptions = computed(() =>
  REBALANCING_TRIGGERS.map((value) => ({
    value,
    label: t(`settings.trigger.${value}`),
    hint: t(`settings.triggerHint.${value}`),
  })),
)

const bandsActive = computed(() => usesBands(settingsStore.settings.rebalancing.trigger))
const calendarActive = computed(() => usesCalendar(settingsStore.settings.rebalancing.trigger))

/** Das Datumsfeld arbeitet mit Zeitstempeln, gespeichert wird ein ISO-Datum. */
const lastRebalancedStamp = computed(() => {
  const stored = portfolioStore.portfolio?.lastRebalancedAt
  if (!stored) return null
  const parsed = new Date(stored)
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
})

/** Wann der nächste Termin ansteht — oder dass noch nie ausgeglichen wurde. */
const scheduleHint = computed(() => {
  const stored = portfolioStore.portfolio?.lastRebalancedAt ?? null
  const months = settingsStore.settings.rebalancing.intervalMonths
  const days = daysUntilDue(stored, months, new Date())
  if (days === null) return t('settings.neverRebalanced')
  if (days <= 0) return t('settings.dueSince', { days: Math.abs(days) })
  return t('settings.dueIn', { days, date: shortDate(nextDueDate(stored, months)) })
})

async function setTrigger(trigger: RebalancingTrigger): Promise<void> {
  await settingsStore.patch({
    rebalancing: { ...settingsStore.settings.rebalancing, trigger },
  })
}

async function setIntervalMonths(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.patch({
    rebalancing: { ...settingsStore.settings.rebalancing, intervalMonths: value },
  })
}

async function setLastRebalanced(stamp: number | null): Promise<void> {
  await portfolioStore.markRebalanced(stamp === null ? null : new Date(stamp).toISOString())
}

async function markToday(): Promise<void> {
  await portfolioStore.markRebalanced(new Date().toISOString())
}

/**
 * Angezeigter Reiter — aus der Adresse, mit „Berechnung" als Rückfallwert.
 *
 * Ein unbekannter Name in der Adresse landet ebenfalls dort: Ein leerer
 * Inhaltsbereich wäre die schlechtere Antwort auf einen Tippfehler.
 */
const activeTab = computed(() => {
  const requested = route.query.tab
  const name = Array.isArray(requested) ? requested[0] : requested
  return typeof name === 'string' && SETTINGS_TABS.includes(name) ? name : 'calc'
})

function setTab(name: string): void {
  void router.replace({ path: '/settings', query: { tab: name } })
}

async function setLowerBand(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.setBands({ ...settingsStore.settings.bands, lowerPercent: value })
}

async function setUpperBand(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.setBands({ ...settingsStore.settings.bands, upperPercent: value })
}

async function setSecurityBuffer(securityBuffer: AmountSetting): Promise<void> {
  await settingsStore.patch({ securityBuffer })
}

async function setMinTradeSize(minTradeSize: AmountSetting): Promise<void> {
  await settingsStore.patch({ minTradeSize })
}

async function setHistoryPeriod(value: HistoryPeriod): Promise<void> {
  await settingsStore.patch({ ui: { ...settingsStore.settings.ui, historyPeriod: value } })
}

async function setNotificationSeconds(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.patch({
    ui: { ...settingsStore.settings.ui, notificationSeconds: value },
  })
}

const themes = THEME_IDS.map((id) => THEMES[id])
const locales = LOCALE_IDS.map((id) => LOCALES[id])
const historyPeriods = HISTORY_PERIODS.map((id) => HISTORY_PERIOD_INFO[id])

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
    <!--
      Der Reiter steht in der Adresse: Nur so kann ein Hinweis anderswo in der
      App auf die zugehörige Einstellung verweisen, statt „ist irgendwo in den
      Einstellungen" zu sagen.
    -->
    <NTabs type="line" animated :value="activeTab" @update:value="setTab">
      <NTabPane name="calc" :tab="t('settings.tabs.calc')">
        <!--
          Zwei Spalten, aber in Lesereihenfolge: Auslöser, dann die Grenzen,
          die er verwendet, dann die Liquidität. Über die volle Breite stünde
          neben dem Auslöser nur Leere.
        -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <!--
              Der Auslöser steht über den Bändern, weil er bestimmt, ob sie
              überhaupt gelten. Umgekehrt gelesen ergäbe die Seite keinen Sinn.
            -->
          <NCard :bordered="false" class="!bg-card mb-4">
            <template #header>
              <span class="inline-flex items-center gap-1.5 text-sm font-medium">
                {{ t('settings.triggerHeading') }}
                <InfoHint :text="t('hints.trigger')" anchor="trigger" />
              </span>
            </template>

            <div class="flex flex-col gap-4">
              <NRadioGroup
                :value="settingsStore.settings.rebalancing.trigger"
                @update:value="setTrigger"
              >
                <NSpace vertical>
                  <NRadio
                    v-for="option in triggerOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    <span class="text-sm">{{ option.label }}</span>
                    <span class="block text-xs text-ink-muted">{{ option.hint }}</span>
                  </NRadio>
                </NSpace>
              </NRadioGroup>

              <!--
                  Termin und Datum nur, wenn ein Kalender im Spiel ist — sonst
                  stünden hier Felder, die auf nichts wirken.
                -->
              <div v-if="calendarActive" class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <label class="flex flex-col gap-1 text-sm">
                  <span class="text-ink-muted">{{ t('settings.intervalMonths') }}</span>
                  <NInputNumber
                    :value="settingsStore.settings.rebalancing.intervalMonths"
                    :min="1"
                    :max="120"
                    :step="1"
                    @update:value="setIntervalMonths"
                  />
                  <span class="text-xs text-ink-muted">{{ t('settings.intervalHint') }}</span>
                </label>

                <label class="flex flex-col gap-1 text-sm">
                  <span class="text-ink-muted">
                    {{
                      t('settings.lastRebalanced', {
                        depot: portfolioStore.portfolio?.name ?? '',
                      })
                    }}
                  </span>
                  <div class="flex gap-2">
                    <NDatePicker
                      class="flex-1"
                      type="date"
                      clearable
                      :value="lastRebalancedStamp"
                      @update:value="setLastRebalanced"
                    />
                    <NButton secondary @click="markToday">{{ t('settings.markToday') }}</NButton>
                  </div>
                  <span class="text-xs text-ink-muted">{{ scheduleHint }}</span>
                </label>
              </div>
            </div>
          </NCard>

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
                  :disabled="!bandsActive"
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
                  :disabled="!bandsActive"
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

            <div class="mt-6">
              <!--
                  Bänder sind relativ zum Ziel — das löst zwar die Blindheit bei
                kleinen Positionen, macht sie aber in Euro überempfindlich: Ein
                Ziel von 2 % mit 6 % Band meldet sich bei 120 €. Dafür lohnt
                keine Order. Die Mindestgröße zieht darunter eine Grenze; die
                Abweichung bleibt sichtbar, nur das Signal unterbleibt.
              -->
              <AmountSettingField
                :label="t('settings.minTradeSize')"
                :setting="settingsStore.settings.minTradeSize"
                :total="total"
                :hint="t('hints.minTradeSize')"
                anchor="bands"
                :zero-hint="t('settings.minTradeUnset')"
                :absolute-step="100"
                @update="setMinTradeSize"
              />
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
              <AmountSettingField
                :label="t('settings.securityBuffer')"
                :setting="settingsStore.settings.securityBuffer"
                :total="total"
                :hint="t('hints.securityBuffer')"
                anchor="reserve"
                :zero-hint="t('settings.bufferUnset')"
                @update="setSecurityBuffer"
              />
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
              <span class="text-sm font-medium">{{ t('history.periodHeading') }}</span>
            </template>

            <div class="flex flex-col gap-2">
              <NButtonGroup size="small">
                <NButton
                  v-for="entry in historyPeriods"
                  :key="entry.id"
                  :type="
                    entry.id === settingsStore.settings.ui.historyPeriod ? 'primary' : 'default'
                  "
                  :secondary="entry.id !== settingsStore.settings.ui.historyPeriod"
                  @click="setHistoryPeriod(entry.id)"
                >
                  {{ t(`history.periodNames.${entry.id}`) }}
                </NButton>
              </NButtonGroup>
              <span class="text-xs text-ink-muted leading-relaxed max-w-2xl">
                {{ t('history.periodHint') }}
              </span>
            </div>
          </NCard>

          <NCard :bordered="false" class="!bg-card">
            <template #header>
              <span class="text-sm font-medium">{{ t('backup.heading') }}</span>
            </template>

            <BackupPanel />
          </NCard>
        </div>
      </NTabPane>

      <NTabPane name="notifications" :tab="t('settings.tabs.notifications')">
        <NCard :bordered="false" class="!bg-card">
          <template #header>
            <span class="text-sm font-medium">{{ t('settings.notificationsHeading') }}</span>
          </template>

          <div class="max-w-md">
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
              <dd class="tabular-nums">
                {{ t('settings.apiLatencyUnit', { ms: api.latencyMs }) }}
              </dd>
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
