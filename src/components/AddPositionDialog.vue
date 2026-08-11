<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NModal, NCard, NSelect, NInputNumber, NButton, NAlert, NTag } from 'naive-ui'
import { suggestAssetGroup } from '@/domain/assetGroup'
import { eurCent, percent } from '@/domain/formatters'
import type { InstrumentSummary } from '@/api/types'
import type { AssetGroup } from '@/types/portfolio'

const props = defineProps<{
  show: boolean
  /** Bereits freigegebene Instrumente (Whitelist angewandt). */
  available: InstrumentSummary[]
  /** Schlüssel der Papiere, die schon im Depot liegen. */
  existingKeys: string[]
  /** Noch nicht vergebener Ziel-Anteil in Prozent. */
  remainingTargetPercent: number
}>()

const emit = defineEmits<{
  (event: 'update:show', value: boolean): void
  (
    event: 'add',
    payload: {
      instrument: InstrumentSummary
      units: number
      targetPercent: number
      group: AssetGroup
    },
  ): void
}>()

const { t } = useI18n()

const selectedKey = ref<string | null>(null)
const units = ref<number>(0)
const targetPercent = ref<number>(0)
const group = ref<AssetGroup>('stocks')

/** Instrumente, die noch nicht im Depot liegen. */
const selectable = computed(() =>
  props.available.filter(
    (instrument) => !props.existingKeys.includes(instrument.isin ?? instrument.symbol),
  ),
)

const options = computed(() =>
  selectable.value.map((instrument) => ({
    label: `${instrument.symbol} — ${instrument.name ?? 'ohne Namen'}`,
    value: instrument.isin ?? instrument.symbol,
  })),
)

const selected = computed<InstrumentSummary | null>(
  () =>
    selectable.value.find(
      (instrument) => (instrument.isin ?? instrument.symbol) === selectedKey.value,
    ) ?? null,
)

const groupOptions = computed<{ label: string; value: AssetGroup }[]>(() => [
  { label: t('groups.stocks'), value: 'stocks' },
  { label: t('groups.bonds'), value: 'bonds' },
  { label: t('groups.metals'), value: 'metals' },
  { label: t('groups.moneymarket'), value: 'moneymarket' },
])

// Bei Auswahl eines Papiers die Gruppe vorschlagen — überschreibbar.
watch(selected, (instrument) => {
  if (!instrument) return
  group.value = suggestAssetGroup(instrument.name, instrument.type)
})

const canSubmit = computed(() => selected.value !== null && units.value > 0)

/** Warnt, wenn die Summe der Ziel-Anteile über 100 % laufen würde. */
const exceedsTarget = computed(() => targetPercent.value > props.remainingTargetPercent)

function close(): void {
  emit('update:show', false)
}

function reset(): void {
  selectedKey.value = null
  units.value = 0
  targetPercent.value = 0
  group.value = 'stocks'
}

function submit(): void {
  const instrument = selected.value
  if (!instrument || !canSubmit.value) return

  emit('add', {
    instrument,
    units: units.value,
    targetPercent: targetPercent.value,
    group: group.value,
  })
  reset()
  close()
}

// Beim Schließen aufräumen, damit der Dialog nicht mit Altwerten aufgeht.
watch(
  () => props.show,
  (open) => {
    if (!open) reset()
  },
)
</script>

<template>
  <NModal :show="show" @update:show="emit('update:show', $event)">
    <NCard
      class="max-w-lg"
      :bordered="false"
      role="dialog"
      aria-modal="true"
      :title="t('actions.addPosition')"
    >
      <div class="flex flex-col gap-4">
        <NAlert v-if="selectable.length === 0" type="info" :bordered="false">
          {{ t('addPosition.allInPortfolio') }}
        </NAlert>

        <template v-else>
          <label class="flex flex-col gap-1 text-sm">
            <span class="text-ink-muted">{{ t('addPosition.instrument') }}</span>
            <NSelect
              v-model:value="selectedKey"
              :options="options"
              filterable
              placeholder="Symbol, ISIN oder Name suchen"
            />
          </label>

          <!-- Kontext zum gewählten Papier, damit die Eingabe nicht blind erfolgt -->
          <div
            v-if="selected"
            class="rounded-md bg-sunken p-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs"
          >
            <div>
              <div class="text-ink-muted">ISIN</div>
              <div class="tabular-nums">{{ selected.isin ?? '—' }}</div>
            </div>
            <div>
              <div class="text-ink-muted">{{ t('table.price') }}</div>
              <div class="tabular-nums">
                {{ selected.latest_price !== null ? eurCent(selected.latest_price) : 'noch keiner' }}
              </div>
            </div>
            <div v-if="selected.ter !== null">
              <div class="text-ink-muted">TER</div>
              <div class="tabular-nums">{{ percent(selected.ter) }}</div>
            </div>
            <div v-if="selected.volatility !== null">
              <div class="text-ink-muted">{{ t('addPosition.volatility') }}</div>
              <div class="tabular-nums">{{ percent(selected.volatility) }}</div>
            </div>
            <div class="col-span-2">
              <NTag size="small" :bordered="false">{{ selected.type ?? t('instruments.unknownType') }}</NTag>
              <NTag v-if="selected.provider" size="small" :bordered="false" class="ml-2">
                {{ selected.provider }}
              </NTag>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <label class="flex flex-col gap-1 text-sm">
              <span class="text-ink-muted">{{ t('table.units') }}</span>
              <NInputNumber v-model:value="units" :min="0" :precision="0" :step="1" />
            </label>

            <label class="flex flex-col gap-1 text-sm">
              <span class="text-ink-muted">{{ t('table.targetPercent') }}</span>
              <NInputNumber
                v-model:value="targetPercent"
                :min="0"
                :max="100"
                :precision="2"
                :step="0.5"
              />
              <span class="text-xs text-ink-muted">
                {{ t('addPosition.remaining', { value: percent(remainingTargetPercent) }) }}
              </span>
            </label>
          </div>

          <label class="flex flex-col gap-1 text-sm">
            <span class="text-ink-muted">{{ t('drilldown.group') }}</span>
            <NSelect v-model:value="group" :options="groupOptions" />
            <span class="text-xs text-ink-muted">
              {{ t('addPosition.groupHint') }}
            </span>
          </label>

          <NAlert v-if="exceedsTarget" type="warning" :bordered="false">
            {{ t('addPosition.targetExceeds') }}
          </NAlert>
        </template>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton size="small" quaternary @click="close">{{ t('actions.cancel') }}</NButton>
          <NButton
            v-if="selectable.length > 0"
            size="small"
            type="primary"
            :disabled="!canSubmit"
            @click="submit"
          >
            {{ t('actions.addPosition') }}
          </NButton>
        </div>
      </template>
    </NCard>
  </NModal>
</template>
