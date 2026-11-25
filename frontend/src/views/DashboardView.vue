<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { NEmpty, NButton } from 'naive-ui'
import DashboardGroups from '@/components/DashboardGroups.vue'
import DashboardKpis from '@/components/DashboardKpis.vue'
import DashboardLoading from '@/components/DashboardLoading.vue'
import DashboardPositionsHead from '@/components/DashboardPositionsHead.vue'
import PortfolioValueChart from '@/components/PortfolioValueChart.vue'
import PositionsTable from '@/components/PositionsTable.vue'
import { integer, percent } from '@/domain/formatters'
import { useAddPosition } from '@/composables/useAddPosition'
import { useDashboardValueHistory } from '@/composables/useDashboardValueHistory'
import { useReferenceIndex } from '@/composables/useReferenceIndex'
import { usePortfolioValuation } from '@/composables/usePortfolioValuation'
import FxNotice from '@/components/FxNotice.vue'
import { baseCurrencyOf } from '@/domain/fx'
import AddPositionDialog from '@/components/AddPositionDialog.vue'
import PositionCardList from '@/components/PositionCardList.vue'
import TradeNotice from '@/components/TradeNotice.vue'
import { useIsCompact } from '@mmit/ux-foundation'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { useAppNotification } from '@/composables/useAppNotification'
import { useQuotesStore } from '@/stores/quotes'
import { useApiStatusStore } from '@/stores/apiStatus'
import { useInstrumentsStore } from '@/stores/instruments'
import { quoteKey } from '@/domain/valuation'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/stockinfo/client'
import type { Position } from '@/types/portfolio'

const { t } = useI18n()
const router = useRouter()

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT)
if (!client) throw new Error('StockInfoClient wurde nicht bereitgestellt')

const portfolioStore = usePortfolioStore()
const settingsStore = useSettingsStore()
const quotesStore = useQuotesStore()
const apiStatus = useApiStatusStore()
const instrumentsStore = useInstrumentsStore()

// Unterhalb von `md` tritt die Leseansicht an die Stelle der Tabelle. Die
// Grenze steht im Fundament — dieselbe, an der auch die SCSS-Mixins kippen.
const isCompact = useIsCompact()

const loading = computed(() => quotesStore.loading)
const failures = computed(() => quotesStore.failures)

const initialLoading = ref(true)
const demoLoading = ref(false)
const ready = computed(() => portfolioStore.loaded && settingsStore.loaded && !initialLoading.value)
const hasHoldings = computed(() => portfolioStore.hasHoldings)

/** Lädt das Beispiel-Depot und holt gleich die passenden Kurse. */
async function onLoadDemo(): Promise<void> {
  demoLoading.value = true
  try {
    await portfolioStore.loadDemo()
    await settingsStore.setActivePortfolio(portfolioStore.portfolio?.id ?? '')
    if (client) await quotesStore.loadQuotes(client, portfolioStore.positions)
  } finally {
    demoLoading.value = false
  }
}

const { result, fx, loadFx, retryFx } = usePortfolioValuation()
const positionsTable = ref<InstanceType<typeof PositionsTable> | null>(null)
function collapsePositionGroups(): void {
  positionsTable.value?.collapseAllGroups()
}

function openPositionGroups(): void {
  positionsTable.value?.openAllGroups()
}

/**
 * Positionen, die in einer anderen Währung notieren als der Basiswährung.
 *
 * Sie zählen nicht in die Summen — 10.000 USD plus 10.000 EUR ergibt keine
 * 20.000 von irgendetwas. Weil sie damit aus jeder Kennzahl verschwinden,
 * muss der Kopf sie nennen: Ein unsichtbarer Ausschluss ist schlimmer als
 * eine falsche Summe, weil man ihn nicht einmal suchen kann.
 */
const foreignCurrencyRows = computed(() =>
  (result.value?.rows ?? []).filter((row) => row.excludedReason === 'currency'),
)

/**
 * Positionen, deren Zahlen nicht vollständig sind.
 *
 * Zwei Ursachen, dieselbe Folge: Der Kurs konnte nicht geladen werden, oder
 * das Papier notiert in fremder Währung. In beiden Fällen fehlt der Position
 * ein Marktwert in der Basiswährung, und sie zählt in keine Summe.
 */
const incompleteCount = computed(
  () =>
    new Set([
      ...failures.value.map((failure) => failure.key),
      ...(result.value?.rows ?? [])
        .filter((row) => row.position.enabled && row.excludedReason !== null)
        .map((row) => quoteKey(row.position)),
    ]).size,
)

// ─── Meldungen ──────────────────────────────────────────────────────────────
//
// Als Toast, nicht im Seitenfluss: Eine Meldung über der Tabelle schiebt sie
// beim Erscheinen nach unten — und zwar genau dann, wenn man gerade liest.

/** Fremdwährungen als Aufzählung, z.B. „BRK.B (USD) · SHOP (CAD)". */
const foreignCurrencySummary = computed(() =>
  foreignCurrencyRows.value
    .map((row) => `${row.position.symbol} (${row.quote?.currency ?? '?'})`)
    .join(' · '),
)

const failureSummary = computed(() =>
  failures.value.map((failure) => `${failure.symbol}: ${failure.reason}`).join(' · '),
)

const { notify } = useAppNotification()

notify(
  computed(() => failures.value.length > 0),
  {
    title: t('notify.quotesMissingTitle'),
    type: 'warning',
    content: () =>
      t('notify.quotesMissingBody', {
        quotes: t('units.quotes', failures.value.length, {
          named: { count: integer(failures.value.length) },
        }),
        details: failureSummary.value,
      }),
  },
)

notify(
  computed(() => foreignCurrencyRows.value.length > 0),
  {
    title: t('currency.warningTitle'),
    type: 'warning',
    content: () => {
      const count = foreignCurrencyRows.value.length
      return t('currency.warningBody', {
        positions: t('units.positions', count, { named: { count: integer(count) } }),
        verb: t('currency.verb', count),
        counts: t('currency.counts', count),
        base: portfolioStore.portfolio?.baseCurrency ?? 'EUR',
        list: foreignCurrencySummary.value,
      })
    },
  },
)

notify(
  computed(() => result.value?.targetsExceeded ?? false),
  {
    title: t('notify.targetsExceededTitle'),
    type: 'error',
    content: () =>
      t('notify.targetsExceededBody', { sum: percent(result.value?.targetPercentSum ?? 0) }),
  },
)

// ─── Position hinzufügen ──────────────────────────────────────────────────

const {
  showAddDialog,
  existingKeys,
  remainingTargetPercent,
  openAddDialog,
  validateNewInstrument,
  onAddPosition,
} = useAddPosition(client)

// ─── Editier-Aktionen — gehen an den Store, der sofort persistiert ─────────

async function onUpdate(id: string, changes: Partial<Position>): Promise<void> {
  await portfolioStore.updatePosition(id, changes)
  // Änderungen an ISIN/Symbol würden einen neuen Kurs erfordern; Bestand,
  // Ziel und Anzeige-Felder nicht — daher kein Reload hier.
}

async function onRemove(id: string): Promise<void> {
  await portfolioStore.removePosition(id)
}

async function onRefreshOne(id: string): Promise<void> {
  const position = portfolioStore.positions.find((entry) => entry.id === id)
  if (position && client) await quotesStore.refreshOne(client, position)
}

const valueChartOpen = ref<boolean>(false)
const {
  valueHistory,
  trendPoints,
  loading: valueHistoryLoading,
  needsHistoricalFx,
  load: loadValueHistory,
} = useDashboardValueHistory({ client, result, fxLoading: () => fx.loading, ready })

/**
 * Vergleichslinie im Wertverlauf (T-143).
 *
 * Geladen erst, wenn das Diagramm aufgeklappt ist — vorher sähe niemand die
 * Linie, für die die Anfrage liefe.
 */
const {
  selected: selectedReference,
  reference: chartReference,
  note: referenceNote,
  load: loadReference,
} = useReferenceIndex(
  client,
  computed(() => baseCurrencyOf(portfolioStore.portfolio)),
)
watch(
  [
    valueChartOpen,
    () => selectedReference.value?.isin,
    () => selectedReference.value?.symbol,
    () => baseCurrencyOf(portfolioStore.portfolio),
  ],
  ([open]) => {
    if (open) void loadReference()
  },
)

onMounted(async () => {
  /*
   * Nur beim ersten Aufbau laden. Ein Ansichtswechsel baut die Seite neu auf;
   * Depot und Einstellungen stehen dann schon in den Stores, und fremde
   * Änderungen kommen über den Live-Abgleich herein. An- und Abmelden laden
   * die ganze Seite neu und beginnen mit leeren Stores.
   */
  if (!portfolioStore.loaded) await portfolioStore.load()
  if (!settingsStore.loaded) await settingsStore.load(portfolioStore.portfolio?.id ?? '')

  // Den Cache laden, bevor die erste Bewertung sichtbar wird.
  await quotesStore.hydrate()

  /*
   * Liegen für das Depot schon Kurse im Cache, steht die Tabelle sofort.
   * Health-Check, fehlende Kurse und die Aktualisierung nach der Schonfrist
   * laufen dann mit Fortschrittsanzeige hinter der sichtbaren Tabelle. Nur
   * beim kalten Start ohne jeden Kurs bleibt die Ladeanzeige, bis der erste
   * Durchgang Werte geholt hat.
   */
  const priced = portfolioStore.positions.filter(
    (position) => position.enabled && position.group !== 'cash',
  )
  if (
    priced.length === 0 ||
    priced.some((position) => quotesStore.quotes.has(quoteKey(position)))
  ) {
    initialLoading.value = false
  }

  /*
   * Erst fragen, dann laden.
   *
   * Mit Schonfrist, weil ein Wechsel zwischen den Ansichten die Seite neu
   * aufbaut und sonst jedes Mal einen vollen Durchgang auslöste — und erst
   * nach dem Health-Check, weil ein toter Dienst sonst je Position eine
   * Zeitüberschreitung kostet und die App hinterher „Kurse fehlen" meldet.
   * Zwei Meldungen für eine Ursache, die vorher feststand.
   */
  if (settingsStore.settings.refresh.autoOnLoad && client) {
    const status = await apiStatus.ensureChecked(
      client,
      settingsStore.settings.refresh.staleAfterMinutes,
    )
    if (status !== 'offline') {
      await quotesStore.loadQuotesIfStale(
        client,
        portfolioStore.positions,
        settingsStore.settings.refresh.staleAfterMinutes,
      )
    }
  }

  // Der Tageswert wird festgehalten, sobald die Kurse stehen — einmal je Tag.
  await loadFx()
  initialLoading.value = false
  await loadValueHistory()
})
</script>

<template>
  <div class="dashboard" :aria-busy="!ready">
    <FxNotice v-if="ready" :result="result" :loading="fx.loading" @retry="retryFx" />
    <p v-if="ready && needsHistoricalFx" class="dashboard__history-note">
      {{ t('fx.historyUnavailable') }}
    </p>
    <!-- Platzhalter halten den Aufbau stabil, bis Depot und Bewertung geladen sind. -->
    <DashboardLoading v-if="!ready" />

    <!--
      Leeres Depot: kein Rebalancing möglich, aber auch keine Sackgasse —
      erste Position, gekennzeichnetes Beispiel-Depot oder eigenes Backup.
    -->
    <NEmpty v-else-if="!hasHoldings" class="dashboard__empty" :description="t('dashboard.empty')">
      <template #extra>
        <div class="dashboard__empty-actions">
          <p class="dashboard__empty-hint">
            {{ t('dashboard.emptyHint') }}
          </p>
          <div class="dashboard__empty-buttons">
            <NButton size="small" type="primary" @click="openAddDialog">
              {{ t('actions.addPosition') }}
            </NButton>
            <NButton size="small" secondary :loading="demoLoading" @click="onLoadDemo">
              {{ t('dashboard.loadDemo') }}
            </NButton>
            <NButton
              size="small"
              secondary
              @click="router.push({ path: '/settings', query: { tab: 'backup' } })"
            >
              {{ t('backup.restore') }}
            </NButton>
          </div>
        </div>
      </template>
    </NEmpty>

    <template v-else-if="result">
      <DashboardKpis
        :result="result"
        :trend="trendPoints"
        :expanded="valueChartOpen"
        :incomplete-count="incompleteCount"
        @toggle="valueChartOpen = !valueChartOpen"
      />

      <!--
        Der Wertverlauf klappt unter der Kachel auf, nicht daneben: So bleibt
        die Kennzahlenzeile schmal und das Diagramm bekommt die volle Breite.
      -->
      <section v-if="valueChartOpen" class="dashboard__value">
        <PortfolioValueChart
          :currency="baseCurrencyOf(portfolioStore.portfolio)"
          :backtest="valueHistory.backtest"
          :snapshots="valueHistory.snapshotLine"
          :truth-from="valueHistory.truthFrom"
          :loading="valueHistoryLoading"
          :reference="chartReference"
          :reference-note="referenceNote"
        />
      </section>

      <!--
        Assetklassen und Tabelle sind ein Bereich, kein Nachbarpaar: Die
        Balkenzeile ist die Kopfzeile dessen, was darunter steht. Ohne die
        Klammer läge zwischen beiden der Blockabstand des Dashboards, und die
        Zeile hinge sichtbar weiter von ihrer Tabelle weg als von der Linie
        über ihr.
      -->
      <div class="dashboard__table-area">
        <DashboardGroups :groups="result.groups" />

        <!-- Positionen -->
        <section class="dashboard__panel">
          <DashboardPositionsHead
            :result="result"
            :compact="isCompact"
            :loading="loading"
            @collapse="collapsePositionGroups"
            @expand="openPositionGroups"
            @add="openAddDialog"
          />

          <PositionCardList
            v-if="isCompact"
            :rows="result.rows"
            :groups="result.groups"
            :links="settingsStore.settings.links"
          />

          <PositionsTable
            v-else
            ref="positionsTable"
            :rows="result.rows"
            :groups="result.groups"
            :total="result.total"
            :targets-exceeded="result.targetsExceeded"
            :links="settingsStore.settings.links"
            :refreshing-ids="quotesStore.refreshing"
            @update="onUpdate"
            @remove="onRemove"
            @refresh="onRefreshOne"
          />
        </section>
        <TradeNotice />
      </div>
    </template>

    <AddPositionDialog
      v-model:show="showAddDialog"
      :available="instrumentsStore.allowedInstruments"
      :existing-keys="existingKeys"
      :allow-cash="!portfolioStore.positions.some((position) => position.group === 'cash')"
      :remaining-target-percent="remainingTargetPercent"
      :validate-instrument="validateNewInstrument"
      @add="onAddPosition"
      @add-cash="({ units, targetPercent }) => portfolioStore.addCashPosition(units, targetPercent)"
    />
  </div>
</template>

<style scoped lang="scss">
/*
 * Blockabstand und Rahmenpolster tragen dieselbe Stufe.
 *
 * Der Abstand stand ab `md` auf `--space-6`, das Polster des Rahmens bleibt
 * bei `--space-4`: Über der Kennzahlenzeile lagen damit 16 px, darunter bis
 * zur Linie der Gruppen 24 px — sichtbar schief, und die Kennzahlen wirkten
 * an die Kopfzeile geklebt.
 */
.dashboard {
  @include stack(var(--space-4));

  @include content-frame;

  &__empty {
    padding: var(--space-8) 0;
  }

  &__empty-actions {
    @include stack(var(--space-3));

    align-items: center;
  }

  /*
   * Ein Satz, kein Absatz: Wer die App öffnet, will sie ausprobieren. Die
   * Erklärung steht auf der Methodenseite, nicht im Leerzustand.
   */
  &__empty-hint {
    @include muted;

    max-width: 24rem;
    line-height: 1.625;
    text-align: center;
  }

  &__empty-buttons {
    @include row;

    flex-wrap: wrap;
    justify-content: center;
  }

  &__value {
    padding-bottom: var(--space-2);
    border-top: 1px solid token(--border-default);
    padding-top: var(--space-4);
  }

  /*
   * Kein Blockabstand zwischen Assetklassen und Tabelle: Der Abstand der
   * Zeile nach unten kommt allein aus ihrem eigenen Polster und ist damit so
   * groß wie der nach oben zur Linie (rund 12 px). Vorher standen dort 28 px
   * — Polster plus Blockabstand — und die Kopfzeile hing bei ihrer Nachbarin
   * statt bei ihrem Inhalt.
   */
  &__table-area {
    @include stack(0);
  }

  &__panel {
    @include up(md) {
      overflow: hidden;
      border: 1px solid token(--border-default);
      border-radius: 0.75rem;
      background-color: token(--surface-card);
    }
  }
}
</style>
