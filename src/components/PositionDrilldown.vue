<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NAlert, NButton, NCard, NIcon, NInput, NInputNumber, NModal, NPopconfirm, NSelect, NSwitch } from 'naive-ui'
import { formatAge } from '@/composables/useRelativeTime'
import { useQuoteIssue } from '@/composables/useQuoteIssue'
import PositionReadDetails from '@/components/PositionReadDetails.vue'
import type { PositionResult } from '@/domain/rebalancing'
import type { AssetGroup, ExternalLink, Position } from '@/types/portfolio'

const props = defineProps<{
  row: PositionResult
  total: number
  links: ExternalLink[]
  visibleStockInfoFields?: readonly string[]
  /** Solange der Kurs dieser Position geholt wird — der Knopf dreht. */
  refreshing?: boolean
}>()

const emit = defineEmits<{
  (event: 'update', id: string, changes: Partial<Position>): void
  (event: 'remove', id: string): void
  (event: 'refresh', id: string): void
}>()

const { t } = useI18n()
const quoteIssue = useQuoteIssue()
const editing = ref(false)
type EditDraft = Pick<Position, 'units' | 'targetPercent' | 'displayName' | 'group' | 'enabled'> & { notes: string }
const draft = ref<EditDraft | null>(null)
const isCash = computed(() => props.row.position.group === 'cash')
const quoteAge = computed(() => formatAge(props.row.quote?.fetchedAt ?? null))
const groupOptions = computed<{ label: string; value: AssetGroup }[]>(() => [
  { label: t('groups.stocks'), value: 'stocks' },
  { label: t('groups.bonds'), value: 'bonds' },
  { label: t('groups.metals'), value: 'metals' },
  { label: t('groups.moneymarket'), value: 'moneymarket' },
  { label: t('groups.cash'), value: 'cash' },
])

function openEditor(): void {
  const position = props.row.position
  draft.value = {
    units: position.units,
    targetPercent: position.targetPercent,
    displayName: position.displayName,
    group: position.group,
    notes: position.notes ?? '',
    enabled: position.enabled,
  }
  editing.value = true
}

function cancelEditor(): void {
  editing.value = false
}

function saveEditor(): void {
  if (!draft.value) return
  emit('update', props.row.position.id, { ...draft.value })
  cancelEditor()
}

function deletePosition(): void {
  emit('remove', props.row.position.id)
  cancelEditor()
}

function updateUnits(value: number | null): void {
  if (draft.value && value !== null) draft.value.units = value
}

function updateTargetPercent(value: number | null): void {
  if (draft.value && value !== null) draft.value.targetPercent = value
}
</script>

<template>
  <div class="drill">
    <NAlert v-if="quoteIssue(row)" type="warning" :bordered="false">{{ quoteIssue(row) }}</NAlert>

    <PositionReadDetails
      :row="row"
      :links="links"
      :visible-stock-info-fields="visibleStockInfoFields"
    >
      <template #toolbar>
        <div class="drill__head">
          <span v-if="row.quote" class="drill__quote-age">{{ t('dashboard.quoteAge') }}: {{ quoteAge }}</span>
          <span v-else-if="!isCash" class="drill__quote-age">{{ t('currency.missingQuote') }}</span>
          <div class="drill__actions">
            <NButton
              v-if="!isCash"
              size="small"
              quaternary
              circle
              class="drill__refresh"
              :class="{ 'drill__refresh--loading': refreshing }"
              :disabled="refreshing"
              :aria-busy="refreshing"
              :aria-label="t('dashboard.reloadQuote')"
              :title="t('dashboard.reloadQuote')"
              @click="emit('refresh', row.position.id)"
            >
              <template #icon>
                <NIcon>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20 10a8 8 0 0 0-14-4M4 14a8 8 0 0 0 14 4" />
                  </svg>
                </NIcon>
              </template>
            </NButton>
            <NButton size="small" type="primary" circle :aria-label="t('drilldown.editHeading')" :title="t('drilldown.editHeading')" @click="openEditor">
              <template #icon>
                <NIcon>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 20h9" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4 10.5-10.5Z" />
                  </svg>
                </NIcon>
              </template>
            </NButton>
          </div>
        </div>
      </template>
    </PositionReadDetails>

    <NModal v-if="draft" :show="editing" @update:show="!$event && cancelEditor()">
      <NCard class="drill__editor" data-position-editor :bordered="false" role="dialog" aria-modal="true" :title="t('drilldown.editHeading')" closable @close="cancelEditor">
        <div class="drill__form">
          <div class="drill__pair">
            <label class="drill__field">
              <span>{{ isCash ? t('dashboard.amountEuro', { currency: row.baseCurrency }) : t('table.units') }}</span>
              <NInputNumber :value="draft.units" :precision="isCash ? 2 : 0" :min="0" :step="isCash ? 100 : 1" size="small" @update:value="updateUnits" />
            </label>
            <label class="drill__field">
              <span>{{ t('table.targetPercent') }}</span>
              <NInputNumber :value="draft.targetPercent" :precision="2" :min="0" :max="100" :step="0.5" size="small" @update:value="updateTargetPercent" />
            </label>
          </div>
          <div class="drill__pair">
            <label class="drill__field">
              <span>{{ t('drilldown.displayName') }}</span>
              <NInput v-model:value="draft.displayName" size="small" />
            </label>
            <label class="drill__field">
              <span>{{ t('drilldown.group') }}</span>
              <NSelect v-model:value="draft.group" :options="groupOptions" size="small" />
            </label>
          </div>
          <label class="drill__field">
            <span>{{ t('drilldown.notes') }}</span>
            <NInput v-model:value="draft.notes" type="textarea" :rows="2" size="small" />
          </label>
          <label class="drill__enabled">
            <span>{{ t('drilldown.enabled') }}</span>
            <NSwitch v-model:value="draft.enabled" size="small" />
          </label>
          <div class="drill__footer">
            <NPopconfirm @positive-click="deletePosition">
              <template #trigger>
                <NButton size="small" quaternary type="error">{{ t('actions.delete') }}</NButton>
              </template>
              {{ t('dashboard.confirmRemove', { name: row.position.displayName }) }}
            </NPopconfirm>
            <div class="drill__footer-actions">
              <NButton size="small" @click="cancelEditor">{{ t('actions.cancel') }}</NButton>
              <NButton size="small" type="primary" @click="saveEditor">{{ t('actions.save') }}</NButton>
            </div>
          </div>
        </div>
      </NCard>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.drill {
  @include stack(var(--space-3));
  min-width: 0;
  width: min(100%, calc(100vw - 5rem));
  box-sizing: border-box;
  padding: var(--space-3);

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-2);
  }
  &__quote-age { @include muted(var(--font-xs)); }
  &__actions { @include row(var(--space-2)); flex-wrap: wrap; }
  &__refresh--loading :deep(svg) { animation: drill-refresh-spin 0.9s linear infinite; }
  &__editor {
    width: min(calc(100vw - 2rem), 48rem);
    min-width: 0;
  }
  &__form, &__field { @include stack(var(--space-2)); }
  &__field { font-size: var(--font-xs); }
  &__pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
  }
  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-top: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid token(--border-subtle);
  }
  &__footer-actions { display: flex; gap: var(--space-2); }
  &__enabled { @include row(var(--space-2)); align-items: center; font-size: var(--font-xs); }
  @media (max-width: 600px) {
    &__pair { grid-template-columns: minmax(0, 1fr); }
    &__footer { flex-wrap: wrap; }
  }
}

@keyframes drill-refresh-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .drill__refresh--loading :deep(svg) { animation: none; }
}
</style>
