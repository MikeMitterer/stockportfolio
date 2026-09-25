<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NInput, NSelect, NSwitch, NButton, NPopconfirm } from 'naive-ui'
import type { AssetGroup, ExternalLink, InstrumentKind } from '@/types/portfolio'
import { ASSET_GROUPS } from '@/types/portfolio'

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

const kindOptions = computed<{ label: string; value: InstrumentKind }[]>(() => [
  { label: t('links.etf'), value: 'etf' },
  { label: t('links.stock'), value: 'stock' },
])
const groupOptions = computed<{ label: string; value: AssetGroup }[]>(() =>
  ASSET_GROUPS.map(value => ({ label: t(`groups.${value}`), value })),
)

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
      appliesToGroups: [],
      enabled: true,
    },
  ])
}
</script>

<template>
  <div class="linkeditor">
    <p class="linkeditor__hint">
      {{ t('links.hint') }}
    </p>

    <div v-if="hasLinks" class="linkeditor__list">
      <div
        v-for="link in links"
        :key="link.id"
        class="linkeditor__row"
      >
        <div class="linkeditor__field linkeditor__field--label">
          <span>{{ t('links.labelPlaceholder') }}</span>
          <NInput :value="link.label" size="small" :placeholder="t('links.labelPlaceholder')" @update:value="(value: string) => patch(link.id, { label: value })" />
        </div>
        <div class="linkeditor__field linkeditor__field--url">
          <span>{{ t('links.url') }}</span>
          <NInput :value="link.urlTemplate" size="small" :placeholder="t('links.urlPlaceholder')" @update:value="(value: string) => patch(link.id, { urlTemplate: value })" />
        </div>
        <div class="linkeditor__field linkeditor__field--kind">
          <span>{{ t('links.appliesToKind') }}</span>
          <NSelect :value="link.appliesTo" :options="kindOptions" multiple size="small" :placeholder="t('links.allKinds')" @update:value="(value: InstrumentKind[]) => patch(link.id, { appliesTo: value ?? [] })" />
        </div>
        <div class="linkeditor__field linkeditor__field--group">
          <span>{{ t('links.appliesToGroup') }}</span>
          <NSelect :value="link.appliesToGroups ?? []" :options="groupOptions" multiple size="small" :placeholder="t('links.allGroups')" @update:value="(value: AssetGroup[]) => patch(link.id, { appliesToGroups: value ?? [] })" />
        </div>
        <div class="linkeditor__controls">
          <NSwitch :value="link.enabled" size="small" :aria-label="t('links.enabled')" @update:value="(value: boolean) => patch(link.id, { enabled: value })" />
          <NPopconfirm @positive-click="remove(link.id)">
            <template #trigger><NButton size="tiny" quaternary type="error">{{ t('actions.delete') }}</NButton></template>
            {{ t('links.confirmDeleteShort', { label: link.label }) }}
          </NPopconfirm>
        </div>
      </div>
    </div>

    <p v-else class="linkeditor__hint">
      {{ t('links.noneConfigured') }}
    </p>

    <div class="linkeditor__actions">
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

<style scoped lang="scss">
.linkeditor {
  @include stack(var(--space-4));

  &__hint {
    font-size: var(--font-xs);
    line-height: 1.625;
    @include muted(null);
  }

  &__list {
    @include stack(var(--space-3));
  }

  /*
   * Zwei Eingabezeilen halten auch bei schmaler Desktopbreite Platz für URL
   * und die beiden unabhängigen Filter.
   */
  &__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'label' 'url' 'kind' 'group' 'controls';
    gap: var(--space-2);
    align-items: center;

    @include up(md) {
      grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
      grid-template-areas:
        'label url url'
        'kind group controls';
    }
  }

  &__row + &__row {
    border-top: 1px solid token(--border-subtle);
    padding-top: var(--space-3);
  }

  &__field {
    display: grid;
    gap: var(--space-1);
    min-width: 0;
    font-size: var(--font-xs);
    @include muted(null);

    &--label { grid-area: label; }
    &--url { grid-area: url; }
    &--kind { grid-area: kind; }
    &--group { grid-area: group; }
  }

  &__controls {
    display: flex;
    align-items: end;
    gap: var(--space-2);
    grid-area: controls;
    padding-bottom: var(--space-1);
  }

  &__actions {
    @include row(var(--space-2));
  }
}
</style>
