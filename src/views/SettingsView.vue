<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NCard, NTag, NInputNumber, NSelect } from 'naive-ui'
import ExternalLinkEditor from '@/components/ExternalLinkEditor.vue'
import { eur } from '@/domain/formatters'
import { computeRebalancing, resolveSecurityBuffer } from '@/domain/rebalancing'
import { useSettingsStore } from '@/stores/settings'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const portfolioStore = usePortfolioStore()
const quotesStore = useQuotesStore()

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

async function setReservePercent(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.patch({ investmentReservePercent: value })
}

async function setBudget(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.patch({ currentRebalancingBudget: value })
}
</script>

<template>
  <div class="max-w-[1400px] mx-auto px-6 py-8">
    <div class="flex items-center gap-3 mb-4">
      <h1 class="text-2xl font-semibold">{{ t('views.settingsTitle') }}</h1>
      <NTag type="warning" size="small" :bordered="false">Teilweise</NTag>
    </div>

    <NCard :bordered="false" class="!bg-card mb-4">
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

    <NCard :bordered="false" class="!bg-card mb-4">
      <template #header>
        <span class="text-sm font-medium">Kennzahlen</span>
      </template>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
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

        <label class="flex flex-col gap-1 text-sm">
          <span class="text-ink-muted">Investitionsreserve (%)</span>
          <NInputNumber
            :value="settingsStore.settings.investmentReservePercent"
            :min="0"
            :max="100"
            :step="1"
            @update:value="setReservePercent"
          />
        </label>

        <label class="flex flex-col gap-1 text-sm">
          <span class="text-ink-muted">Rebalancing-Budget (€)</span>
          <NInputNumber
            :value="settingsStore.settings.currentRebalancingBudget"
            :min="0"
            :step="10000"
            @update:value="setBudget"
          />
        </label>
      </div>
    </NCard>

    <NCard :bordered="false" class="!bg-card mb-4">
      <template #header>
        <span class="text-sm font-medium">Externe Verweise</span>
      </template>

      <ExternalLinkEditor
        :links="settingsStore.settings.links"
        @update="settingsStore.setLinks"
        @reset="settingsStore.resetLinks"
      />
    </NCard>

    <NCard :bordered="false" class="!bg-card">
      <p class="text-sm text-ink-secondary leading-relaxed">
        Portfolio-Verwaltung, Refresh-Verhalten, Anzeige-Spalten, Export/Import und
        API-Health-Check folgen in T-11.
      </p>
    </NCard>
  </div>
</template>
