<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NCard, NTag } from 'naive-ui'

const { t } = useI18n()
</script>

<template>
  <div class="max-w-[1400px] mx-auto px-6 py-8">
    <div class="flex items-center gap-3 mb-4">
      <h1 class="text-2xl font-semibold">{{ t('views.instrumentsTitle') }}</h1>
      <NTag type="warning" size="small" :bordered="false">Preview</NTag>
    </div>
    <NCard :bordered="false" class="!bg-neutral-100 dark:!bg-neutral-900">
      <p class="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
        {{ t('views.instrumentsComingSoon') }}
      </p>
      <p class="text-xs text-neutral-500 mt-4">
        Ticket T-10 (Instruments-View + Add-Position-Dialog) im
        <code class="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800">_tickets/</code>-Board.
      </p>
    </NCard>
  </div>
</template>
