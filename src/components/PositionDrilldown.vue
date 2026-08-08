<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NCard,
  NDivider,
  NInputNumber,
  NInput,
  NSelect,
  NSwitch,
  NButton,
  NPopconfirm,
} from 'naive-ui'
import {
  eur,
  eurCent,
  eurSigned,
  integer,
  number,
  percent,
  percentSigned,
} from '@/domain/formatters'
import { formatAge } from '@/composables/useRelativeTime'
import { resolveKind, resolveLinks } from '@/domain/links'
import SuggestionBadge from '@/components/SuggestionBadge.vue'
import type { PositionResult } from '@/domain/rebalancing'
import type { AssetGroup, Bands, ExternalLink, Position } from '@/types/portfolio'

const props = defineProps<{
  row: PositionResult
  total: number
  bands: Bands
  links: ExternalLink[]
}>()

const emit = defineEmits<{
  (event: 'update', id: string, changes: Partial<Position>): void
  (event: 'apply-trade', id: string, tradeUnits: number): void
  (event: 'remove', id: string): void
  (event: 'refresh', id: string): void
}>()

const { t } = useI18n()

const isCash = computed(() => props.row.position.group === 'cash')

const groupOptions = computed<{ label: string; value: AssetGroup }[]>(() => [
  { label: t('groups.stocks'), value: 'stocks' },
  { label: t('groups.bonds'), value: 'bonds' },
  { label: t('groups.metals'), value: 'metals' },
  { label: t('groups.cash'), value: 'cash' },
])

// ─── Trade-Simulator ────────────────────────────────────────────────────────

const tradeUnits = ref<number>(0)

// Beim Wechsel auf eine andere Position den Simulator zurücksetzen.
watch(
  () => props.row.position.id,
  () => {
    tradeUnits.value = 0
  },
)

const simulatedUnits = computed(() => props.row.position.units + tradeUnits.value)

const simulatedMarketValue = computed(() => {
  if (isCash.value) return simulatedUnits.value
  if (!props.row.quote) return 0
  return simulatedUnits.value * props.row.quote.price
})

const simulatedActualPercent = computed(() =>
  props.total > 0 ? (simulatedMarketValue.value * 100) / props.total : 0,
)

const simulatedRelativeDelta = computed(() => {
  if (props.row.targetValue === 0) return 0
  return ((simulatedMarketValue.value - props.row.targetValue) * 100) / props.row.targetValue
})

const simulatedTradeEuro = computed(() => {
  if (isCash.value) return tradeUnits.value
  if (!props.row.quote) return 0
  return tradeUnits.value * props.row.quote.price
})

const canApplyTrade = computed(() => tradeUnits.value !== 0 && simulatedUnits.value >= 0)

function applyTrade(): void {
  if (!canApplyTrade.value) return
  emit('apply-trade', props.row.position.id, tradeUnits.value)
  tradeUnits.value = 0
}

// ─── Editieren — jede Änderung geht direkt raus ─────────────────────────────

function updateUnits(value: number | null): void {
  if (value === null) return
  emit('update', props.row.position.id, { units: value })
}

function updateTargetPercent(value: number | null): void {
  if (value === null) return
  emit('update', props.row.position.id, { targetPercent: value })
}

function updateDisplayName(value: string): void {
  emit('update', props.row.position.id, { displayName: value })
}

function updateGroup(value: AssetGroup): void {
  emit('update', props.row.position.id, { group: value })
}

function updateEnabled(value: boolean): void {
  emit('update', props.row.position.id, { enabled: value })
}

function updateNotes(value: string): void {
  emit('update', props.row.position.id, { notes: value })
}

// ─── Links ──────────────────────────────────────────────────────────────────

/**
 * Verweise aus den Einstellungen, gefiltert nach Gattung.
 *
 * Der Kurs-Typ dient als Rückfall: Positionen, die vor der Einführung von
 * `kind` angelegt wurden, haben das Feld nicht — ihre Gattung kommt dann
 * aus dem Kurs.
 */
const resolvedLinks = computed(() =>
  resolveLinks(props.row.position, props.links, props.row.quote?.type),
)

/** Gattung für die Anzeige — Aktie, ETF oder unbekannt. */
const kind = computed(() => resolveKind(props.row.position, props.row.quote?.type))

const kindLabel = computed(() => {
  if (kind.value === 'etf') return 'ETF'
  if (kind.value === 'stock') return 'Aktie'
  return null
})

const quoteAge = computed(() => formatAge(props.row.quote?.fetchedAt ?? null))

const optimalUnits = computed(() =>
  props.row.quote && props.row.quote.price > 0
    ? Math.round(props.row.targetValue / props.row.quote.price)
    : null,
)

const deltaEuro = computed(() => props.row.targetValue - props.row.marketValue)
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
    <!-- ─── Position bearbeiten ──────────────────────────────────────── -->
    <NCard :bordered="false" size="small" class="!bg-raised">
      <template #header>
        <span class="text-sm font-medium">{{ t('drilldown.editHeading') }}</span>
      </template>

      <div class="flex flex-col gap-3">
        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1 text-xs">
            <span class="text-ink-muted">
              {{ isCash ? 'Betrag (€)' : t('table.units') }}
            </span>
            <NInputNumber
              :value="row.position.units"
              :precision="isCash ? 2 : 0"
              :min="0"
              :step="isCash ? 100 : 1"
              size="small"
              @update:value="updateUnits"
            />
          </label>

          <label class="flex flex-col gap-1 text-xs">
            <span class="text-ink-muted">{{ t('table.targetPercent') }}</span>
            <NInputNumber
              :value="row.position.targetPercent"
              :precision="2"
              :min="0"
              :max="100"
              :step="0.5"
              size="small"
              @update:value="updateTargetPercent"
            />
          </label>
        </div>

        <label class="flex flex-col gap-1 text-xs">
          <span class="text-ink-muted">{{ t('drilldown.displayName') }}</span>
          <NInput
            :value="row.position.displayName"
            size="small"
            @update:value="updateDisplayName"
          />
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1 text-xs">
            <span class="text-ink-muted">{{ t('drilldown.group') }}</span>
            <NSelect
              :value="row.position.group"
              :options="groupOptions"
              size="small"
              @update:value="updateGroup"
            />
          </label>

          <label class="flex flex-col gap-1 text-xs">
            <span class="text-ink-muted">{{ t('drilldown.enabled') }}</span>
            <div class="pt-1">
              <NSwitch
                :value="row.position.enabled"
                size="small"
                @update:value="updateEnabled"
              />
            </div>
          </label>
        </div>

        <label class="flex flex-col gap-1 text-xs">
          <span class="text-ink-muted">{{ t('drilldown.notes') }}</span>
          <NInput
            :value="row.position.notes ?? ''"
            type="textarea"
            :rows="2"
            size="small"
            @update:value="updateNotes"
          />
        </label>

        <div class="flex items-center gap-2 pt-1">
          <NButton size="tiny" secondary @click="emit('refresh', row.position.id)">
            Kurs neu laden
          </NButton>
          <NPopconfirm @positive-click="emit('remove', row.position.id)">
            <template #trigger>
              <NButton size="tiny" quaternary type="error">{{ t('actions.delete') }}</NButton>
            </template>
            Position „{{ row.position.displayName }}" wirklich löschen?
          </NPopconfirm>
        </div>
      </div>
    </NCard>

    <!-- ─── Trade-Simulator ──────────────────────────────────────────── -->
    <NCard :bordered="false" size="small" class="!bg-raised">
      <template #header>
        <span class="text-sm font-medium">{{ t('drilldown.tradeSimulator') }}</span>
      </template>

      <div class="flex flex-col gap-3">
        <label class="flex flex-col gap-1 text-xs">
          <span class="text-ink-muted">{{ t('drilldown.tradeSimulatorHint') }}</span>
          <NInputNumber
            v-model:value="tradeUnits"
            :precision="isCash ? 2 : 0"
            :step="isCash ? 100 : 1"
            size="small"
          />
        </label>

        <div class="rounded-md bg-sunken p-3 flex flex-col gap-2 text-xs">
          <div class="flex justify-between">
            <span class="text-ink-muted">Neuer Bestand</span>
            <span class="tabular-nums">{{ integer(simulatedUnits) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-muted">Trade-Wert</span>
            <span
              class="tabular-nums"
              :class="tradeUnits >= 0 ? 'text-status-out' : 'text-status-ok'"
            >
              {{ eurSigned(-simulatedTradeEuro) }}
            </span>
          </div>
          <NDivider class="!my-1" />
          <div class="flex justify-between">
            <span class="text-ink-muted">{{ t('drilldown.projectedActual') }}</span>
            <span class="tabular-nums">{{ percent(simulatedActualPercent) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-muted">{{ t('drilldown.projectedDelta') }}</span>
            <span class="tabular-nums">{{ percentSigned(simulatedRelativeDelta) }}</span>
          </div>
        </div>

        <NButton size="small" type="primary" :disabled="!canApplyTrade" @click="applyTrade">
          {{ t('drilldown.tradeApply') }}
        </NButton>
      </div>
    </NCard>

    <!-- ─── Zusatz-Zahlen ────────────────────────────────────────────── -->
    <NCard :bordered="false" size="small" class="!bg-raised lg:col-span-2">
      <template #header>
        <span class="text-sm font-medium">Details</span>
      </template>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 text-xs">
        <div>
          <div class="text-ink-muted">ISIN</div>
          <div class="tabular-nums">{{ row.position.isin ?? '—' }}</div>
        </div>
        <div>
          <div class="text-ink-muted">Symbol</div>
          <div class="tabular-nums">{{ row.position.symbol }}</div>
        </div>
        <div>
          <div class="text-ink-muted">Kurs</div>
          <div class="tabular-nums">{{ row.quote ? eurCent(row.quote.price) : '—' }}</div>
        </div>
        <div>
          <div class="text-ink-muted">Marktwert</div>
          <div class="tabular-nums">{{ eur(row.marketValue) }}</div>
        </div>

        <div>
          <div class="text-ink-muted">{{ t('drilldown.lowerBand') }}</div>
          <div class="tabular-nums">{{ eur(row.lowerBand) }}</div>
        </div>
        <div>
          <div class="text-ink-muted">Ziel-Wert</div>
          <div class="tabular-nums">{{ eur(row.targetValue) }}</div>
        </div>
        <div>
          <div class="text-ink-muted">{{ t('drilldown.upperBand') }}</div>
          <div class="tabular-nums">{{ eur(row.upperBand) }}</div>
        </div>
        <div>
          <div class="text-ink-muted">{{ t('drilldown.deltaEuro') }}</div>
          <div
            class="tabular-nums"
            :class="row.suggestion === 'ok' ? 'text-status-ok' : 'text-status-out'"
          >
            {{ eurSigned(deltaEuro) }}
          </div>
        </div>

        <div v-if="optimalUnits !== null">
          <div class="text-ink-muted">{{ t('drilldown.optimalUnits') }}</div>
          <div class="tabular-nums">{{ integer(optimalUnits) }}</div>
        </div>
        <div>
          <div class="text-ink-muted">Δ Bestand (Stück)</div>
          <div class="tabular-nums">{{ number(row.unitsDelta) }}</div>
        </div>
        <div v-if="row.quote?.volatility != null">
          <div class="text-ink-muted">{{ t('drilldown.volatility') }}</div>
          <div class="tabular-nums">{{ percent(row.quote.volatility) }}</div>
        </div>
        <div v-if="row.quote?.ter != null">
          <div class="text-ink-muted">TER</div>
          <div class="tabular-nums">{{ percent(row.quote.ter) }}</div>
        </div>
        <div v-if="row.quote">
          <div class="text-ink-muted">Kurs-Stand</div>
          <div class="tabular-nums">{{ quoteAge }}</div>
        </div>

        <div v-if="kindLabel">
          <div class="text-ink-muted">Gattung</div>
          <div>{{ kindLabel }}</div>
        </div>

        <div class="col-span-2 md:col-span-3 lg:col-span-4 flex items-center gap-3 pt-2">
          <a
            v-for="link in resolvedLinks"
            :key="link.id"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent hover:opacity-80 text-xs underline"
          >
            {{ link.label }} ↗
          </a>
          <span v-if="resolvedLinks.length === 0" class="text-xs text-ink-muted">
            Keine passenden Verweise — unter „Einstellungen" konfigurierbar.
          </span>
          <div class="ml-auto">
            <SuggestionBadge :suggestion="row.suggestion" :near="row.isNearBand" />
          </div>
        </div>
      </div>
    </NCard>
  </div>
</template>
