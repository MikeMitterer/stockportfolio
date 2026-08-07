<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NCard, NTag } from 'naive-ui'
import { MOCK_SETTINGS } from '@/mock/portfolio'
import { eur, percent } from '@/domain/formatters'

const { t } = useI18n()
</script>

<template>
  <div class="max-w-[1400px] mx-auto px-6 py-8">
    <div class="flex items-center gap-3 mb-4">
      <h1 class="text-2xl font-semibold">{{ t('views.settingsTitle') }}</h1>
      <NTag type="warning" size="small" :bordered="false">Preview</NTag>
    </div>

    <NCard :bordered="false" class="!bg-neutral-100 dark:!bg-neutral-900 mb-4">
      <p class="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
        {{ t('views.settingsComingSoon') }}
      </p>
    </NCard>

    <NCard :bordered="false" class="!bg-neutral-100 dark:!bg-neutral-900">
      <template #header>
        <span class="text-sm font-medium">Aktuelle Mock-Settings</span>
      </template>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <div class="flex justify-between border-b border-neutral-200 dark:border-neutral-800 py-2">
          <span class="text-neutral-500">Lower Band</span>
          <span class="tabular-nums">{{ percent(MOCK_SETTINGS.bands.lowerPercent) }}</span>
        </div>
        <div class="flex justify-between border-b border-neutral-200 dark:border-neutral-800 py-2">
          <span class="text-neutral-500">Upper Band</span>
          <span class="tabular-nums">{{ percent(MOCK_SETTINGS.bands.upperPercent) }}</span>
        </div>
        <div class="flex justify-between border-b border-neutral-200 dark:border-neutral-800 py-2">
          <span class="text-neutral-500">Save-Asset-Grenze</span>
          <span class="tabular-nums">{{ eur(MOCK_SETTINGS.saveAssetGrenze) }}</span>
        </div>
        <div class="flex justify-between border-b border-neutral-200 dark:border-neutral-800 py-2">
          <span class="text-neutral-500">Investitionsreserve</span>
          <span class="tabular-nums">{{ percent(MOCK_SETTINGS.investmentReservePercent) }}</span>
        </div>
        <div class="flex justify-between border-b border-neutral-200 dark:border-neutral-800 py-2">
          <span class="text-neutral-500">Rebalancing-Budget</span>
          <span class="tabular-nums">{{ eur(MOCK_SETTINGS.currentRebalancingBudget) }}</span>
        </div>
        <div class="flex justify-between border-b border-neutral-200 dark:border-neutral-800 py-2">
          <span class="text-neutral-500">Rundung Gesamtwert</span>
          <span class="tabular-nums">10^{{ MOCK_SETTINGS.totalRounding }}</span>
        </div>
      </div>
    </NCard>
  </div>
</template>
