<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NInput, NSelect, NSwitch, NButton, NPopconfirm } from 'naive-ui'
import type { ExternalLink, InstrumentKind } from '@/types/portfolio'

const { t } = useI18n()

/**
 * Pflege der externen Verweise.
 *
 * Adressen sind weder allgemeingültig noch dauerhaft: der Meldefonds-Nachweis
 * der ÖKB gilt nur für Österreich, Anbieter ändern ihre Pfade. Deshalb hier
 * pflegbar statt im Code verdrahtet.
 */
const props = defineProps<{
  links: ExternalLink[]
}>()

const emit = defineEmits<{
  (event: 'update', links: ExternalLink[]): void
  (event: 'reset'): void
}>()

const kindOptions: { label: string; value: InstrumentKind }[] = [
  { label: t('links.etf'), value: 'etf' },
  { label: t('links.stock'), value: 'stock' },
]

const hasLinks = computed(() => props.links.length > 0)

function patch(id: string, changes: Partial<ExternalLink>): void {
  emit(
    'update',
    props.links.map((link) => (link.id === id ? { ...link, ...changes } : link)),
  )
}

function remove(id: string): void {
  emit(
    'update',
    props.links.filter((link) => link.id !== id),
  )
}

function add(): void {
  emit('update', [
    ...props.links,
    {
      id: `link-${Date.now().toString(36)}`,
      label: t('links.newLink'),
      urlTemplate: 'https://example.com/{isin}',
      appliesTo: [],
      enabled: true,
    },
  ])
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-xs text-ink-muted leading-relaxed">
      {{ t('links.hint') }}
    </p>

    <div v-if="hasLinks" class="flex flex-col gap-3">
      <div
        v-for="link in links"
        :key="link.id"
        class="grid grid-cols-1 md:grid-cols-[10rem_1fr_9rem_auto_auto] gap-2 items-center"
      >
        <NInput
          :value="link.label"
          size="small"
          placeholder="Bezeichnung"
          @update:value="(value: string) => patch(link.id, { label: value })"
        />
        <NInput
          :value="link.urlTemplate"
          size="small"
          placeholder="https://…/{isin}"
          @update:value="(value: string) => patch(link.id, { urlTemplate: value })"
        />
        <NSelect
          :value="link.appliesTo"
          :options="kindOptions"
          multiple
          size="small"
          placeholder="alle"
          @update:value="(value: InstrumentKind[]) => patch(link.id, { appliesTo: value ?? [] })"
        />
        <NSwitch
          :value="link.enabled"
          size="small"
          @update:value="(value: boolean) => patch(link.id, { enabled: value })"
        />
        <NPopconfirm @positive-click="remove(link.id)">
          <template #trigger>
            <NButton size="tiny" quaternary type="error">{{ t('actions.delete') }}</NButton>
          </template>
          {{ t('links.confirmDeleteShort', { label: link.label }) }}
        </NPopconfirm>
      </div>
    </div>

    <p v-else class="text-xs text-ink-muted">
      {{ t('links.noneConfigured') }}
    </p>

    <div class="flex items-center gap-2">
      <NButton size="small" secondary @click="add">{{ t('links.add') }}</NButton>
      <NPopconfirm @positive-click="emit('reset')">
        <template #trigger>
          <NButton size="small" quaternary>{{ t('links.reset') }}</NButton>
        </template>
        {{ t('links.confirmResetShort') }}
      </NPopconfirm>
    </div>
  </div>
</template>
