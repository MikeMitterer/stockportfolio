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
import type { AssetGroup, ExternalLink, Position } from '@/types/portfolio'

const props = defineProps<{
  row: PositionResult
  total: number
  links: ExternalLink[]
  /** Solange der Kurs dieser Position geholt wird — der Knopf dreht. */
  refreshing?: boolean
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
  <div class="drill">
    <div class="drill__columns">
      <!-- ─── Position bearbeiten ──────────────────────────────────────── -->
      <NCard :bordered="false" size="small" class="drill__card drill__card--full">
        <template #header>
          <span class="drill__heading">{{ t('drilldown.editHeading') }}</span>
        </template>

        <div class="drill__form">
          <div class="drill__pair">
            <label class="drill__field">
              <span class="drill__label">
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

            <label class="drill__field">
              <span class="drill__label">{{ t('table.targetPercent') }}</span>
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

          <label class="drill__field">
            <span class="drill__label">{{ t('drilldown.displayName') }}</span>
            <NInput
              :value="row.position.displayName"
              size="small"
              @update:value="updateDisplayName"
            />
          </label>

          <div class="drill__pair">
            <label class="drill__field">
              <span class="drill__label">{{ t('drilldown.group') }}</span>
              <NSelect
                :value="row.position.group"
                :options="groupOptions"
                size="small"
                @update:value="updateGroup"
              />
            </label>

            <label class="drill__field">
              <span class="drill__label">{{ t('drilldown.enabled') }}</span>
              <div class="drill__switch">
                <NSwitch
                  :value="row.position.enabled"
                  size="small"
                  @update:value="updateEnabled"
                />
              </div>
            </label>
          </div>

          <label class="drill__field">
            <span class="drill__label">{{ t('drilldown.notes') }}</span>
            <NInput
              :value="row.position.notes ?? ''"
              type="textarea"
              :rows="2"
              size="small"
              @update:value="updateNotes"
            />
          </label>

          <div class="drill__actions">
            <NButton
              size="tiny"
              secondary
              :loading="refreshing"
              :disabled="refreshing"
              @click="emit('refresh', row.position.id)"
            >
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
      <NCard :bordered="false" size="small" class="drill__card drill__card--full">
        <template #header>
          <span class="drill__heading">{{ t('dashboard.details') }}</span>
        </template>

        <div class="drill__facts">
          <div>
            <div class="drill__label">ISIN</div>
            <div class="tabular-nums">{{ row.position.isin ?? '—' }}</div>
          </div>
          <div>
            <div class="drill__label">{{ t('table.symbol') }}</div>
            <div class="tabular-nums">{{ row.position.symbol }}</div>
          </div>
          <div>
            <div class="drill__label">{{ t('table.price') }}</div>
            <div class="tabular-nums">{{ row.quote ? eurCent(row.quote.price) : '—' }}</div>
          </div>
          <div>
            <div class="drill__label">{{ t('table.marketValue') }}</div>
            <div class="tabular-nums">{{ eur(row.marketValue) }}</div>
          </div>

          <div>
            <div class="drill__label">{{ t('drilldown.lowerBand') }}</div>
            <div class="tabular-nums">{{ eur(row.lowerBand) }}</div>
          </div>
          <div>
            <div class="drill__label">{{ t('dashboard.targetValue') }}</div>
            <div class="tabular-nums">{{ eur(row.targetValue) }}</div>
          </div>
          <div>
            <div class="drill__label">{{ t('drilldown.upperBand') }}</div>
            <div class="tabular-nums">{{ eur(row.upperBand) }}</div>
          </div>
          <div>
            <div class="drill__label">{{ t('drilldown.deltaEuro') }}</div>
            <div
              class="tabular-nums"
              :class="row.suggestion === 'ok' ? 'drill__ok' : 'drill__out'"
            >
              {{ eurSigned(deltaEuro) }}
            </div>
          </div>

          <div v-if="optimalUnits !== null">
            <div class="drill__label">{{ t('drilldown.optimalUnits') }}</div>
            <div class="tabular-nums">{{ integer(optimalUnits) }}</div>
          </div>
          <div>
            <div class="drill__label">{{ t('dashboard.unitsDelta') }}</div>
            <div class="tabular-nums">{{ number(row.unitsDelta) }}</div>
          </div>
          <div v-if="row.quote?.volatility != null">
            <div class="drill__label">{{ t('drilldown.volatility') }}</div>
            <div class="tabular-nums">{{ percent(row.quote.volatility) }}</div>
          </div>
          <div v-if="row.quote?.ter != null">
            <div class="drill__label">TER</div>
            <div class="tabular-nums">{{ percent(row.quote.ter) }}</div>
          </div>
          <div v-if="row.quote">
            <div class="drill__label">{{ t('dashboard.quoteAge') }}</div>
            <div class="tabular-nums">{{ quoteAge }}</div>
          </div>

          <div v-if="kindLabel">
            <div class="drill__label">{{ t('dashboard.kind') }}</div>
            <div>{{ kindLabel }}</div>
          </div>

          <div class="drill__links">
            <a
              v-for="link in resolvedLinks"
              :key="link.id"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="drill__link"
            >
              {{ link.label }} ↗
            </a>
            <span v-if="resolvedLinks.length === 0" class="drill__no-links">
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
      class="drill__card"
    >
      <PriceChart
        :position="row.position"
        :client="client"
        :currency="row.quote?.currency ?? 'EUR'"
      />
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.drill {
  @include stack(var(--space-3));

  padding: var(--space-3);

  /*
   * Zwei Spalten: links bearbeiten, rechts nachlesen. Der Kursverlauf steht
   * darunter über die volle Breite — dann bleiben die Details oben stehen,
   * statt neben einem hohen Diagramm zu verhungern.
   */
  &__columns {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-3);

    @include up(lg) {
      grid-template-columns: minmax(0, 22rem) minmax(0, 1fr);
    }
  }

  &__card {
    background-color: token(--surface-raised) !important;

    &--full { height: 100%; }
  }

  &__heading {
    font-size: var(--font-sm);
    font-weight: 500;
  }

  &__form { @include stack; }

  &__pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-2);
  }

  &__field {
    @include stack(var(--space-1));

    font-size: var(--font-xs);
  }

  &__label { @include muted(null); }

  &__switch { padding-top: var(--space-1); }

  &__actions { @include row; }

  &__facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-2) 1.25rem;
    font-size: var(--font-xs);

    @include up(md) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    @include up(xl) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }

  &__ok { color: token(--status-ok); }
  &__out { color: token(--status-out); }

  &__links {
    @include row(var(--space-3));

    grid-column: span 2;
    padding-top: var(--space-1);

    @include up(md) { grid-column: span 3; }
    @include up(xl) { grid-column: span 4; }
  }

  &__link {
    font-size: var(--font-xs);
    color: token(--accent);
    text-decoration: underline;

    &:hover { opacity: 0.8; }
  }

  &__no-links { @include muted; }
}
</style>
