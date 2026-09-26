<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NInput, NSelect, NSwitch, NButton, NPopconfirm } from 'naive-ui'
import type { AssetGroup, ExternalLink, InstrumentKind } from '@/types/portfolio'
import type { InstrumentTypeCatalog } from '@/types/instrumentTypes'
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
  typeCatalog?: InstrumentTypeCatalog | null
  typesLoading?: boolean
  typesError?: string | null
}>()

const emit = defineEmits<{
  (event: 'update', links: ExternalLink[]): void
  (event: 'reset'): void
  (event: 'reload-types'): void
}>()

/** Fehlende gespeicherte Filter nur an ihrem Verweis erhalten, niemals als Ersatzkatalog. */
function kindOptions(link: ExternalLink): { label: string; value: InstrumentKind }[] {
  const available = props.typeCatalog?.types ?? []
  const retained = link.appliesTo.filter(type => !available.includes(type))
  const absentLabel = props.typeCatalog?.complete ? 'links.typeNotOffered' : 'links.typeUnconfirmed'
  return [
    ...available.map(type => ({ label: type, value: type })),
    ...retained.map(type => ({ label: t(absentLabel, { type }), value: type })),
  ]
}
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

    <div class="linkeditor__catalog" role="status">
      <span v-if="typesLoading">{{ t('links.typesLoading') }}</span>
      <span v-else-if="typesError">{{ t('links.typesFailed', { reason: typesError }) }}</span>
      <span v-else-if="typeCatalog && !typeCatalog.complete">{{ t('links.typesIncomplete') }}</span>
      <span v-else-if="typeCatalog && !typeCatalog.types.length">{{ t('links.typesEmpty') }}</span>
      <span v-else>{{ t('links.typesSource') }}</span>
      <NButton text size="small" :loading="typesLoading" @click="emit('reload-types')">{{ t('links.reloadTypes') }}</NButton>
    </div>

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
          <NSelect :value="link.appliesTo" :options="kindOptions(link)" :loading="typesLoading" :aria-label="t('links.appliesToKind')" filterable multiple size="small" :placeholder="t('links.allKinds')" @update:value="(value: InstrumentKind[]) => patch(link.id, { appliesTo: value ?? [] })" />
        </div>
        <div class="linkeditor__field linkeditor__field--group">
          <span>{{ t('links.appliesToGroup') }}</span>
          <NSelect :value="link.appliesToGroups ?? []" :options="groupOptions" multiple size="small" :placeholder="t('links.allGroups')" @update:value="(value: AssetGroup[]) => patch(link.id, { appliesToGroups: value ?? [] })" />
        </div>
        <div class="linkeditor__controls">
          <NSwitch :value="link.enabled" size="small" :aria-label="t('links.enabled')" @update:value="(value: boolean) => patch(link.id, { enabled: value })" />
          <NPopconfirm @positive-click="remove(link.id)">
            <template #trigger><NButton size="tiny" quaternary type="error">{{ t('actions.delete') }}</NButton></template>
            <p class="linkeditor__delete-confirmation">{{ t('links.confirmDeleteShort', { label: link.label }) }}</p>
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

  &__catalog {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-2);
    font-size: var(--font-xs);
    @include muted(null);
    overflow-wrap: anywhere;
  }

  &__list {
    @include stack(var(--space-3));
  }

  /*
   * Am Desktop bleibt jeder Verweis in einer Zeile. Auf schmaleren Ansichten
   * stehen Adresse und Filter untereinander, ohne horizontales Scrollen.
   */
  &__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'label' 'url' 'kind' 'group' 'controls';
    gap: var(--space-2);
    align-items: end;

    @include up(md) {
      grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
      grid-template-areas:
        'label url url'
        'kind group controls';
    }

    @include up(lg) {
      grid-template-columns: minmax(9rem, 1fr) minmax(12rem, 2fr) minmax(9rem, 1fr) minmax(9rem, 1fr) auto;
      grid-template-areas: 'label url kind group controls';
    }
  }

  &__row + &__row {
    border-top: 1px solid token(--border-subtle);
    padding-top: var(--space-3);

    @include up(lg) {
      border-top: 0;
      padding-top: 0;

      // Beschriftungen bleiben für Hilfstechnik erreichbar, ohne jede Zeile zu wiederholen.
      .linkeditor__field > span {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    }
  }

  &__field {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
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
    align-items: center;
    gap: var(--space-2);
    grid-area: controls;
    padding-bottom: var(--space-1);
  }

  &__actions {
    @include row(var(--space-2));
  }

  &__delete-confirmation {
    margin: 0;
    padding: var(--space-3) var(--space-2);
    max-width: min(22rem, calc(100vw - 6rem));
    overflow-wrap: anywhere;
  }
}
</style>
