<script setup lang="ts">
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NCard,
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
} from '@/domain/formatters'
import { formatAge } from '@/composables/useRelativeTime'
import { resolveKind, resolveLinks } from '@/domain/links'
import PriceChart from '@/components/PriceChart.vue'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'
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
  (event: 'remove', id: string): void
  (event: 'refresh', id: string): void
}>()

const { t } = useI18n()

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT) ?? null

const isCash = computed(() => props.row.position.group === 'cash')

const groupOptions = computed<{ label: string; value: AssetGroup }[]>(() => [
  { label: t('groups.stocks'), value: 'stocks' },
  { label: t('groups.bonds'), value: 'bonds' },
  { label: t('groups.metals'), value: 'metals' },
  { label: t('groups.moneymarket'), value: 'moneymarket' },
  { label: t('groups.cash'), value: 'cash' },
])

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
  if (kind.value === 'etf') return t('dashboard.kindEtf')
  if (kind.value === 'stock') return t('dashboard.kindStock')
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
  <!--
    Zwei Spalten statt zweier gestapelter Karten über die volle Breite.

    Das Formular braucht nur so viel Platz wie seine Felder — über die ganze
    Tabellenbreite gezogen standen darin einzelne Eingaben mit meterlangem
    Leerraum daneben, und die Details rutschten unter den Falz. Nebeneinander
    ist der aufgeklappte Bereich rund halb so hoch.
  -->
  <div class="flex flex-col gap-3 p-3">
    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] gap-3">
      <!-- ─── Position bearbeiten ──────────────────────────────────────── -->
      <NCard :bordered="false" size="small" class="!bg-raised h-full">
        <template #header>
          <span class="text-sm font-medium">{{ t('drilldown.editHeading') }}</span>
        </template>

        <div class="flex flex-col gap-2">
          <div class="grid grid-cols-2 gap-2">
            <label class="flex flex-col gap-1 text-xs">
              <span class="text-ink-muted">
                {{ isCash ? t('dashboard.amountEuro') : t('table.units') }}
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

          <div class="grid grid-cols-2 gap-2">
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

          <div class="flex items-center gap-2">
            <NButton size="tiny" secondary @click="emit('refresh', row.position.id)">
              {{ t('dashboard.reloadQuote') }}
            </NButton>
            <NPopconfirm @positive-click="emit('remove', row.position.id)">
              <template #trigger>
                <NButton size="tiny" quaternary type="error">{{ t('actions.delete') }}</NButton>
              </template>
              {{ t('dashboard.confirmRemove', { name: row.position.displayName }) }}
            </NPopconfirm>
          </div>
        </div>
      </NCard>

      <!-- ─── Zusatz-Zahlen ────────────────────────────────────────────── -->
      <NCard :bordered="false" size="small" class="!bg-raised h-full">
        <template #header>
          <span class="text-sm font-medium">{{ t('dashboard.details') }}</span>
        </template>

        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-2 text-xs">
          <div>
            <div class="text-ink-muted">ISIN</div>
            <div class="tabular-nums">{{ row.position.isin ?? '—' }}</div>
          </div>
          <div>
            <div class="text-ink-muted">{{ t('table.symbol') }}</div>
            <div class="tabular-nums">{{ row.position.symbol }}</div>
          </div>
          <div>
            <div class="text-ink-muted">{{ t('table.price') }}</div>
            <div class="tabular-nums">{{ row.quote ? eurCent(row.quote.price) : '—' }}</div>
          </div>
          <div>
            <div class="text-ink-muted">{{ t('table.marketValue') }}</div>
            <div class="tabular-nums">{{ eur(row.marketValue) }}</div>
          </div>

          <div>
            <div class="text-ink-muted">{{ t('drilldown.lowerBand') }}</div>
            <div class="tabular-nums">{{ eur(row.lowerBand) }}</div>
          </div>
          <div>
            <div class="text-ink-muted">{{ t('dashboard.targetValue') }}</div>
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
            <div class="text-ink-muted">{{ t('dashboard.unitsDelta') }}</div>
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
            <div class="text-ink-muted">{{ t('dashboard.quoteAge') }}</div>
            <div class="tabular-nums">{{ quoteAge }}</div>
          </div>

          <div v-if="kindLabel">
            <div class="text-ink-muted">{{ t('dashboard.kind') }}</div>
            <div>{{ kindLabel }}</div>
          </div>

          <div class="col-span-2 md:col-span-3 xl:col-span-4 flex items-center gap-3 pt-1">
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
              {{ t('dashboard.noMatchingLinks') }}
            </span>
          </div>
        </div>
      </NCard>
    </div>

    <!-- ─── Kursverlauf ──────────────────────────────────────────────── -->
    <NCard
      v-if="row.position.group !== 'cash'"
      :bordered="false"
      size="small"
      class="!bg-raised"
    >
      <PriceChart
        :position="row.position"
        :client="client"
        :currency="row.quote?.currency ?? 'EUR'"
      />
    </NCard>
  </div>
</template>
