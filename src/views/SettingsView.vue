<script setup lang="ts">
import { computed, inject, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NCard, NTabPane, NTabs, NTag, NInputNumber, NSelect } from 'naive-ui'
import ExternalLinkEditor from '@/components/ExternalLinkEditor.vue'
import { eur } from '@/domain/formatters'
import { computeRebalancing, resolveSecurityBuffer } from '@/domain/rebalancing'
import { useSettingsStore } from '@/stores/settings'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { useThemeStore } from '@/stores/theme'
import { THEME_IDS, THEMES } from '@/theme/themes'
import { useApiStatus } from '@/composables/useApiStatus'
import { useRelativeTime } from '@/composables/useRelativeTime'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const portfolioStore = usePortfolioStore()
const quotesStore = useQuotesStore()
const themeStore = useThemeStore()

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
  // Ungefragt prüfen: Wer diese Seite öffnet, will den Zustand sehen, nicht
  // erst einen Knopf suchen.
  await api.check()
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

const bufferModeOptions = [
  { label: '% vom Gesamtwert', value: 'percent' as const },
  { label: 'Fester Betrag (€)', value: 'absolute' as const },
]

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

// ─── Status der Gegenstelle ─────────────────────────────────────────────────

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT) ?? null
const api = useApiStatus(client)
const apiCheckedAgo = useRelativeTime(api.checkedAt)

/** Die Adresse aus `VITE_STOCKINFO_API_URL`, wie sie beim Bauen gesetzt wurde. */
const apiUrl = computed(() => client?.url ?? '—')

const API_STATE_LABEL: Record<string, string> = {
  unknown: 'noch nicht geprüft',
  checking: 'wird geprüft …',
  online: 'erreichbar',
  offline: 'nicht erreichbar',
}
</script>

<template>
  <div class="max-w-[1400px] mx-auto px-6 py-8">
    <div class="flex items-center gap-3 mb-4">
      <h1 class="text-2xl font-semibold">{{ t('views.settingsTitle') }}</h1>
      <NTag type="warning" size="small" :bordered="false">Teilweise</NTag>
    </div>

    <!--
      Gegliedert statt gestapelt: Rechenvorgaben, Aussehen und Verweise haben
      nichts miteinander zu tun; untereinander ergaben sie eine lange Seite,
      auf der man scrollen musste, um überhaupt zu sehen, was es gibt.
    -->
    <NTabs type="line" animated>
      <NTabPane name="calc" tab="Berechnung">
        <!-- Zwei Spalten: beide Karten sind schmal, nebeneinander spart Höhe. -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          <NCard :bordered="false" class="!bg-card">
            <template #header>
              <span class="text-sm font-medium">Toleranzbänder</span>
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
                  Unterschreitet der Marktwert das Ziel um mehr als diesen Anteil → Kaufen.
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
                  Überschreitet der Marktwert das Ziel um mehr als diesen Anteil → Verkaufen.
                </span>
              </label>
            </div>
          </NCard>

          <NCard :bordered="false" class="!bg-card">
            <template #header>
              <span class="text-sm font-medium">Kennzahlen</span>
            </template>

            <div class="grid grid-cols-1 gap-6">
              <!--
              Zwei Lesarten des Puffers, beide gültig: ein Notgroschen ist ein
              fester Betrag und wächst nicht mit dem Depot; ein Liquiditätsanteil
              ist ein Prozentsatz. Statt eine Auslegung zu erzwingen, steht die
              Wahl hier — mit dem daraus folgenden Euro-Betrag als Kontrolle.
            -->
              <label class="flex flex-col gap-1 text-sm">
                <span class="text-ink-muted">Sicherheitspuffer</span>
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
                    Nicht festgelegt — die ganze Liquidität gilt als Reserve.
                  </template>
                  <template v-else>
                    Entspricht derzeit {{ eur(securityBufferEuro) }}.
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
                <span class="text-ink-muted">Meldungen ausblenden nach (s)</span>
                <NInputNumber
                  :value="settingsStore.settings.ui.notificationSeconds"
                  :min="0"
                  :max="120"
                  :step="1"
                  @update:value="setNotificationSeconds"
                />
                <span class="text-xs text-ink-muted">
                  <template v-if="settingsStore.settings.ui.notificationSeconds === 0">
                    Bleiben stehen, bis die Ursache behoben ist oder du sie wegklickst.
                  </template>
                  <template v-else>
                    Blenden sich selbst aus — früher, wenn die Ursache vorher wegfällt.
                  </template>
                </span>
              </label>
            </div>
          </NCard>
        </div>
      </NTabPane>

      <NTabPane name="theme" tab="Darstellung">
        <NCard :bordered="false" class="!bg-card">
          <template #header>
            <span class="text-sm font-medium">Theme</span>
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
                <span class="text-sm font-medium">{{ theme.label }}</span>
                <span
                  v-if="themeStore.current === theme.id"
                  class="text-[10px] uppercase tracking-wide text-accent"
                >
                  aktiv
                </span>
              </span>
              <span class="text-xs text-ink-muted leading-tight">{{ theme.hint }}</span>
            </button>
          </div>
        </NCard>
      </NTabPane>

      <NTabPane name="status" tab="Status">
        <NCard :bordered="false" class="!bg-card">
          <template #header>
            <div class="flex items-center justify-between gap-4">
              <span class="text-sm font-medium">StockInfo-API</span>
              <NButton
                size="small"
                secondary
                :loading="api.state.value === 'checking'"
                @click="api.check()"
              >
                Erneut prüfen
              </NButton>
            </div>
          </template>

          <dl class="grid grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)] gap-x-6 gap-y-3 text-sm">
            <dt class="text-ink-muted">Adresse</dt>
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

            <dt class="text-ink-muted">Zustand</dt>
            <dd class="flex items-center gap-2">
              <span
                class="inline-block h-2 w-2 rounded-full shrink-0"
                :class="{
                  'bg-status-ok': api.state.value === 'online',
                  'bg-status-out': api.state.value === 'offline',
                  'bg-ink-muted': api.state.value !== 'online' && api.state.value !== 'offline',
                }"
                aria-hidden="true"
              ></span>
              <span
                :class="
                  api.state.value === 'online'
                    ? 'text-status-ok'
                    : api.state.value === 'offline'
                      ? 'text-status-out'
                      : 'text-ink-muted'
                "
              >
                {{ API_STATE_LABEL[api.state.value] }}
              </span>
              <span v-if="api.status.value" class="text-ink-muted">
                — meldet „{{ api.status.value }}"
              </span>
            </dd>

            <template v-if="api.version.value">
              <dt class="text-ink-muted">Version</dt>
              <dd class="tabular-nums">{{ api.version.value }}</dd>
            </template>

            <template v-if="api.latencyMs.value !== null">
              <dt class="text-ink-muted">Antwortzeit</dt>
              <dd class="tabular-nums">{{ api.latencyMs.value }} ms</dd>
            </template>

            <template v-if="api.checkedAt.value">
              <dt class="text-ink-muted">Geprüft</dt>
              <dd class="text-ink-secondary">{{ apiCheckedAgo }}</dd>
            </template>

            <template v-if="api.error.value">
              <dt class="text-ink-muted">Grund</dt>
              <dd class="text-status-out">{{ api.error.value }}</dd>
            </template>
          </dl>

          <p v-if="api.state.value === 'offline'" class="mt-4 text-xs text-ink-muted leading-relaxed">
            Ohne die API gibt es keine Kurse und damit keine Kennzahlen. Die
            zuletzt geladenen Kurse bleiben gespeichert und werden weiter
            verwendet — erkennbar am Alter in der Kopfzeile.
          </p>
        </NCard>
      </NTabPane>

      <NTabPane name="links" tab="Verweise">
        <NCard :bordered="false" class="!bg-card">
          <template #header>
            <span class="text-sm font-medium">Externe Verweise</span>
          </template>

          <ExternalLinkEditor
            :links="settingsStore.settings.links"
            @update="settingsStore.setLinks"
            @reset="settingsStore.resetLinks"
          />
        </NCard>
      </NTabPane>
    </NTabs>

    <NCard :bordered="false" class="!bg-card">
      <p class="text-sm text-ink-secondary leading-relaxed">
        Portfolio-Verwaltung, Refresh-Verhalten, Anzeige-Spalten und Export/Import
        folgen in T-11.
      </p>
    </NCard>
  </div>
</template>
