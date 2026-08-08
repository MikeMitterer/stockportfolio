<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NCard, NTag, NInputNumber } from 'naive-ui'
import ExternalLinkEditor from '@/components/ExternalLinkEditor.vue'
import { useSettingsStore } from '@/stores/settings'
import { usePortfolioStore } from '@/stores/portfolio'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const portfolioStore = usePortfolioStore()

onMounted(async () => {
  if (!portfolioStore.loaded) await portfolioStore.load()
  if (!settingsStore.loaded) await settingsStore.load(portfolioStore.portfolio?.id ?? '')
})

async function setLowerBand(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.setBands({ ...settingsStore.settings.bands, lowerPercent: value })
}

async function setUpperBand(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.setBands({ ...settingsStore.settings.bands, upperPercent: value })
}

async function setSaveAssetGrenze(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.patch({ saveAssetGrenze: value })
}

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
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-ink-muted">Save-Asset-Grenze (€)</span>
          <NInputNumber
            :value="settingsStore.settings.saveAssetGrenze"
            :min="0"
            :step="10000"
            @update:value="setSaveAssetGrenze"
          />
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
