<script setup lang="ts">
import { usePortfolioCurrency } from '@/composables/usePortfolioCurrency'
import { computed, inject, onMounted, ref, watch } from 'vue'
import GroupActionIcon from '@/components/GroupActionIcon.vue'
import { UxCaret } from '@mmit/ux-foundation'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { NEmpty, NButton } from 'naive-ui'
import InfoHint from '@/components/InfoHint.vue'
import KpiCard from '@/components/KpiCard.vue'
import PortfolioValueChart from '@/components/PortfolioValueChart.vue'
import { useHistoryStore } from '@/stores/history'
import { useValueHistoryStore } from '@/stores/valueHistory'
import { withinDays, type BacktestInput } from '@/domain/portfolioHistory'
import GroupBar from '@/components/GroupBar.vue'
import PositionsTable from '@/components/PositionsTable.vue'
import { integer, percent, shortDate } from '@/domain/formatters'
import { usePortfolioValuation } from '@/composables/usePortfolioValuation'
import FxNotice from '@/components/FxNotice.vue'
import { baseCurrencyOf, majorCurrency } from '@/domain/fx'
import { nextDueDate, usesBands } from '@/domain/schedule'
import AddPositionDialog from '@/components/AddPositionDialog.vue'
import TargetAllocationBar from '@/components/TargetAllocationBar.vue'
import PositionCardList from '@/components/PositionCardList.vue'
import TradeNotice from '@/components/TradeNotice.vue'
import { safeStorage, useIsCompact } from '@mmit/ux-foundation'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { useAppNotification } from '@/composables/useAppNotification'
import { useQuotesStore } from '@/stores/quotes'
import { useApiStatusStore } from '@/stores/apiStatus'
import { useInstrumentsStore } from '@/stores/instruments'
import { newId } from '@/db/seed'
import { quoteKey } from '@/domain/rebalancing'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'
import type { InstrumentSummary } from '@/api/types'
import type { AssetGroup, Position } from '@/types/portfolio'

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
const ready = computed(() =>
  portfolioStore.loaded && settingsStore.loaded && !initialLoading.value,
)
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
const visibleGroups = computed(() => (result.value?.groups ?? []).filter(
  group => group.actualPercent !== 0 || group.targetPercent !== 0,
))
const positionsTable = ref<InstanceType<typeof PositionsTable> | null>(null)
const positionGroupCount = computed(() => new Set(result.value?.rows.map(row => row.position.group) ?? []).size)

function collapsePositionGroups(): void {
  positionsTable.value?.collapseAllGroups()
}

function openPositionGroups(): void {
  positionsTable.value?.openAllGroups()
}

const bandsActive = computed(() => usesBands(settingsStore.settings.rebalancing.trigger))

/** „Termin fällig" oder „nächster Termin am …" — je nach Stand. */
const scheduleLabel = computed(() => {
  const schedule = result.value?.schedule
  if (!schedule) return ''
  if (schedule.due) return t('dashboard.scheduleDue')
  return t('dashboard.scheduleNext', {
    date: shortDate(
      nextDueDate(schedule.lastRebalancedAt, settingsStore.settings.rebalancing.intervalMonths),
    ),
  })
})

const liquidityTone = computed<'positive' | 'warning' | 'danger'>(() => {
  const buffer = result.value?.liquidity.investmentReserve ?? 0
  if (buffer >= 0) return 'positive'
  if (buffer > -50_000) return 'warning'
  return 'danger'
})

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
const incompleteCount = computed(() => new Set([
  ...failures.value.map(failure => failure.key),
  ...(result.value?.rows ?? [])
    .filter(row => row.position.enabled && row.excludedReason !== null)
    .map(row => quoteKey(row.position)),
]).size)

/*
 * Positiv formuliert: Der Normalfall ist „Vollständig", nicht „keine
 * Probleme". Eine Kennzahl, die im Guten eine Verneinung zeigt, liest sich wie
 * ein Mangel, den man gerade noch abgewendet hat.
 */
const dataStatusValue = computed(() =>
  incompleteCount.value === 0
    ? t('kpi.dataComplete')
    : t('kpi.dataIncomplete', { count: integer(incompleteCount.value) }),
)

const dataStatusTone = computed<'positive' | 'danger'>(() =>
  incompleteCount.value === 0 ? 'positive' : 'danger',
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

const showAddDialog = ref<boolean>(false)

/** Schlüssel der bereits enthaltenen Papiere — verhindert Dubletten. */
const existingKeys = computed(() =>
  portfolioStore.positions
    .filter((position) => position.group !== 'cash')
    .map((position) => position.isin ?? position.symbol),
)

/** Noch nicht vergebener Ziel-Anteil. */
const remainingTargetPercent = computed(() => {
  const assigned = portfolioStore.positions.reduce(
    (sum, position) => sum + position.targetPercent,
    0,
  )
  return Math.max(0, 100 - assigned)
})

async function openAddDialog(): Promise<void> {
  showAddDialog.value = true
  if (!instrumentsStore.loaded && client) await instrumentsStore.load(client)
}

async function validateNewInstrument(instrument: InstrumentSummary): Promise<void> {
  if (!client) throw new Error(t('notify.noClient'))
  await quotesStore.loadOne(client, instrument)
}

async function onAddPosition(payload: {
  instrument: InstrumentSummary
  units: number
  targetPercent: number
  group: AssetGroup
}): Promise<void> {
  const { instrument, units, targetPercent, group } = payload

  await portfolioStore.addPosition({
    id: newId(),
    isin: instrument.isin,
    symbol: instrument.symbol,
    // Gattung mitschreiben — sie entscheidet später über die externen Verweise.
    kind: quotesStore.quotes.get(instrument.isin ?? instrument.symbol)?.type ?? instrument.type,
    displayName: instrument.name ?? instrument.symbol,
    group,
    units,
    targetPercent,
    enabled: true,
  })
}

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

// ─── Assetklassen-Block ein-/ausklappbar ──────────────────────────────────

const GROUPS_COLLAPSED_KEY = 'stockportfolio.dashboard.groupsCollapsed'
const groupsCollapsed = ref<boolean>(false)

// ─── Wertverlauf ────────────────────────────────────────────────────────────
//
// Überblick oben, Einzelheiten auf Klick: In der Gesamtwert-Kachel steht eine
// kleine Linie, das ausführliche Diagramm klappt darunter auf. Dauerhaft
// sichtbar würde es die Tabelle nach unten drücken — und die ist der Grund,
// warum jemand das Dashboard öffnet.

const historyStore = useHistoryStore()
const valueHistory = useValueHistoryStore()

/**
 * Zeitraum, den der Rückblick lädt.
 *
 * Der längste, den die API kennt: Das Diagramm schneidet daraus zu, statt je
 * Schaltfläche eine eigene Abfrage zu stellen.
 */
const BACKTEST_PERIOD = 'max' as const

/**
 * Fenster der kleinen Linie in der Kachel — dasselbe wie die Vorgabe des
 * Diagramms.
 *
 * Über „max" stünde dort ein Prozentwert von mehreren hundert Prozent neben
 * dem Gesamtwert. Das läse sich wie eine Wertentwicklung, ist aber der
 * Rückblick: der heutige Bestand, gegen Kurse von vor Jahren gerechnet.
 */
const TREND_DAYS = 90

/** Gemessene Werte, solange es genug davon gibt; sonst der Rückblick. */
const trendPoints = computed(() => {
  const source =
    valueHistory.snapshotLine.length > 1 ? valueHistory.snapshotLine : valueHistory.backtest
  return withinDays(source, TREND_DAYS, new Date())
})
const valueChartOpen = ref<boolean>(false)
const valueHistoryLoading = ref<boolean>(false)

/** Bestände mit ihrem Kursverlauf — Grundlage des Rückblicks. */
const needsHistoricalFx = computed(() => (result.value?.rows ?? []).some(row => row.position.enabled && row.quote && majorCurrency(row.quote.currency) !== row.baseCurrency))
const completeValuation = computed(() => !!result.value && result.value.rows.every(row => !row.position.enabled || row.isActive))
const backtestInputs = computed<BacktestInput[]>(() =>
  needsHistoricalFx.value || !completeValuation.value ? [] :
  (result.value?.rows ?? [])
    .filter((row) => row.isActive)
    .map((row) => ({
      units: row.position.units,
      points: historyStore.get(row.position, BACKTEST_PERIOD).points.map(point => ({ ...point, close: row.quote?.currency === 'GBp' ? point.close / 100 : point.close })),
      constantValue: row.marketValue,
    })),
)

/**
 * Holt den langen Verlauf für alle Positionen und rechnet den Rückblick.
 *
 * Ein Zeitraum reicht: Das Diagramm schneidet daraus zu, statt für jede
 * Schaltfläche neu zu laden.
 */
async function loadValueHistory(): Promise<void> {
  const portfolio = portfolioStore.portfolio
  if (!portfolio) return

  valueHistoryLoading.value = true
  try {
    await valueHistory.ensure(portfolio.id, baseCurrencyOf(portfolio))

    await Promise.all(
      portfolioStore.positions
        .filter((position) => position.enabled)
        .map((position) => historyStore.ensure(client ?? null, position, BACKTEST_PERIOD)),
    )

    if (portfolioStore.portfolio?.id !== portfolio.id) return
    valueHistory.computeBacktest(backtestInputs.value)
    await recordCurrentValue()
  } finally {
    valueHistoryLoading.value = false
  }
}

onMounted(async () => {
  /*
   * Über `safeStorage`, nicht direkt: Vorher stand hier ein blankes
   * `localStorage.getItem`. Im privaten Modus wirft schon der Zugriff — und
   * weil die Zeile vor dem Laden des Depots steht, blieb die ganze Ansicht
   * leer. Wegen eines eingeklappten Blocks.
   */
  const stored = safeStorage.read(GROUPS_COLLAPSED_KEY)
  if (stored === '1' || stored === '0') {
    groupsCollapsed.value = stored === '1'
  }

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
  const priced = portfolioStore.positions.filter((position) => position.enabled && position.group !== 'cash')
  if (priced.length === 0 || priced.some((position) => quotesStore.quotes.has(quoteKey(position)))) {
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

/** Unvollständige Summen sind keine Tageswerte des ganzen Depots. */
async function recordCurrentValue(): Promise<void> {
  const portfolio = portfolioStore.portfolio
  if (!portfolio || !valueHistory.loaded || fx.loading || !completeValuation.value) return
  await valueHistory.record(portfolio.id, result.value?.total ?? 0, baseCurrencyOf(portfolio))
}

watch(() => [result.value, fx.loading], () => {
  valueHistory.computeBacktest(backtestInputs.value)
  void recordCurrentValue()
})
// Einzelne Quellen: Ein neu geladenes, gleiches Depot stößt nichts an (T-83).
watch([() => portfolioStore.portfolio?.id, () => portfolioStore.portfolio?.baseCurrency], () => { if (ready.value) void loadValueHistory() })

watch(groupsCollapsed, (collapsed) => {
  safeStorage.write(GROUPS_COLLAPSED_KEY, collapsed ? '1' : '0')
})

function toggleGroups(): void {
  groupsCollapsed.value = !groupsCollapsed.value
}
const { baseCurrency, formatMoney, formatMoneySigned } = usePortfolioCurrency()

</script>

<template>
  <div class="dashboard" :aria-busy="!ready">
    <FxNotice v-if="ready" :result="result" :loading="fx.loading" @retry="retryFx" />
    <p v-if="ready && needsHistoricalFx" class="dashboard__history-note">{{ t('fx.historyUnavailable') }}</p>
    <!-- Platzhalter halten den Aufbau stabil, bis Depot und Bewertung geladen sind. -->
    <div v-if="!ready" class="dashboard__loading" role="status" :aria-label="t('dashboard.loading')">
      <div class="dashboard__loading-kpis" aria-hidden="true">
        <div v-for="index in 4" :key="index" class="dashboard__loading-kpi">
          <span class="dashboard__loading-line dashboard__loading-line--short" />
          <span class="dashboard__loading-line dashboard__loading-line--value" />
        </div>
      </div>
      <div class="dashboard__loading-table" aria-hidden="true">
        <span class="dashboard__loading-line dashboard__loading-line--short" />
        <span v-for="index in 4" :key="index" class="dashboard__loading-line" />
      </div>
      <span class="dashboard__loading-caption">{{ t('dashboard.loading') }}</span>
    </div>

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
            <NButton size="small" secondary @click="router.push({ path: '/settings', query: { tab: 'backup' } })">
              {{ t('backup.restore') }}
            </NButton>
          </div>
        </div>
      </template>
    </NEmpty>

    <template v-else-if="result">
      <!-- Fehler-Banner bei fehlgeschlagenen Kursen -->
      <!-- Kennzahlen -->
      <section class="dashboard__kpis">
        <KpiCard
          :label="t('kpi.total')"
          :value="formatMoney(result.total)"
          :hint="baseCurrency"
          :hint-explanation="t('hints.baseCurrency')"
          hint-settings-tab="data"
          :trend="trendPoints"
          expandable
          :expanded="valueChartOpen"
          @toggle="valueChartOpen = !valueChartOpen"
        />
        <KpiCard
          :label="t('kpi.investmentReserve')"
          :explanation="t('hints.investmentReserve')"
          anchor="reserve"
          settings-tab="calc"
          :value="formatMoneySigned(result.liquidity.investmentReserve)"
          :hint="t('kpi.investmentReserveHint')"
          :tone="liquidityTone"
        />
        <KpiCard
          :label="t('kpi.investmentReservePercent')"
          :explanation="t('hints.securityBuffer')"
          anchor="reserve"
          settings-tab="calc"
          :value="percent(result.liquidity.investmentReservePercent)"
          :hint="t('kpi.securityBufferHint', { buffer: formatMoney(result.liquidity.securityBuffer) })"
        />
        <!--
          Beschreibt die Datenlage, nicht die Lage zum Ziel: Ein „Below" in der
          Zeile ist ein normaler Zustand, ein fehlender Kurs eine Lücke. Ohne
          den Hinweis läse sich die Kennzahl neben fünf Below-Zeilen wie ein
          Widerspruch.
        -->
        <KpiCard
          :label="t('kpi.dataStatus')"
          :value="dataStatusValue"
          :tone="dataStatusTone"
          :explanation="t('hints.dataStatus')"
          anchor="limits"
        />
      </section>

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
        <!--
          Gruppen-Balken (ein-/ausklappbar). Auf schmalen Bildschirmen
          ausgeblendet: die Gruppen-Trenner der Kartenliste zeigen dieselben
          Zahlen, und die Balkenzeile bräuchte hier acht Spalten Platz.
        -->
        <section class="dashboard__groups">
          <button
            type="button"
            class="dashboard__groups-toggle"
            :aria-expanded="!groupsCollapsed"
            aria-controls="dashboard-groups-panel"
            @click="toggleGroups"
          >
            <!-- `turn` wie im Gruppenkopf darunter — dieselbe Aussage, dieselbe Bewegung. -->
            <UxCaret :open="!groupsCollapsed" motion="turn" />
            <h2 class="dashboard__section-title">
              {{ t('dashboard.assetClasses') }}
            </h2>

            <!-- Eingeklappt: kompakte Zusammenfassung statt leerer Fläche -->
            <span v-if="groupsCollapsed" class="dashboard__summary tabular-nums">
              <span
                v-for="group in visibleGroups"
                :key="group.group"
                class="dashboard__summary-item"
                :class="group.suggestion === 'ok' ? 'dashboard__summary-item--ok' : 'dashboard__summary-item--flagged'"
              >
                {{ t(`groups.${group.group}`) }} {{ percent(group.actualPercent) }}
              </span>
            </span>
          </button>

          <div
            v-show="!groupsCollapsed"
            id="dashboard-groups-panel"
            class="dashboard__group-list"
          >
            <GroupBar v-for="group in visibleGroups" :key="group.group" :group="group" />
          </div>
        </section>

        <!-- Positionen -->
        <section class="dashboard__panel">
          <div class="dashboard__panel-head">
            <div class="dashboard__panel-heading">
              <h2 class="dashboard__panel-title">
                {{ isCompact ? t('dashboard.positionsShort') : t('dashboard.positionsHeading') }}
              </h2>
              <div v-if="!isCompact && positionGroupCount > 1" class="dashboard__group-actions">
                <button type="button" class="dashboard__group-action" :aria-label="t('table.collapseAllGroups')" :title="t('table.collapseAllGroups')" @click="collapsePositionGroups">
                  <GroupActionIcon class="dashboard__group-symbol" action="collapse" />
                </button>
                <button type="button" class="dashboard__group-action" :aria-label="t('table.expandAllGroups')" :title="t('table.expandAllGroups')" @click="openPositionGroups">
                  <GroupActionIcon class="dashboard__group-symbol" action="expand" />
                </button>
              </div>
            </div>
            <div class="dashboard__panel-meta">
              <TargetAllocationBar
                v-if="!isCompact"
                :sum="result.targetPercentSum"
                :exceeded="result.targetsExceeded"
              />
              <div class="dashboard__bands tabular-nums">
                <!--
                  Bänder nur nennen, wenn sie gelten: Im reinen Kalendermodus
                  stünde hier sonst eine Grenze, nach der niemand mehr fragt.
                -->
                <template v-if="bandsActive">
                  {{
                    t('dashboard.bands', {
                      lower: percent(settingsStore.settings.bands.lowerPercent),
                      upper: percent(settingsStore.settings.bands.upperPercent),
                    })
                  }}
                  <InfoHint
                    :text="t('hints.bands')"
                    anchor="bands"
                    settings-tab="calc"
                    class="dashboard__hint"
                  />
                </template>
                <span v-if="result.schedule.active" class="dashboard__schedule">
                  <span :class="{ 'dashboard__due': result.schedule.due }">{{
                    scheduleLabel
                  }}</span>
                  <InfoHint
                    :text="t('hints.trigger')"
                    anchor="trigger"
                    settings-tab="calc"
                    class="dashboard__hint"
                  />
                </span>
                <span v-if="loading" class="dashboard__schedule">{{ t('common.loading') }}</span>
              </div>
              <NButton size="tiny" secondary @click="openAddDialog">
                {{ t('actions.addPosition') }}
              </NButton>
            </div>
          </div>

          <PositionCardList v-if="isCompact" :rows="result.rows" :groups="result.groups" :links="settingsStore.settings.links" />

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
      :allow-cash="!portfolioStore.positions.some(position => position.group === 'cash')"
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

  &__loading {
    @include stack(var(--space-4));
  }

  &__loading-kpis {
    display: grid;
    grid-template-columns: 1fr;

    @include up(sm) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    @include up(lg) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }

  &__loading-kpi, &__loading-table {
    @include stack(var(--space-4));

    padding: var(--space-4);
    border: 1px solid token(--border-subtle);
    border-radius: var(--radius-sm);
  }

  &__loading-kpi { min-height: 7rem; }
  &__loading-table { min-height: 16rem; }

  &__loading-line {
    display: block;
    width: 100%;
    height: 0.75rem;
    border-radius: var(--radius-sm);
    background-color: token(--border-subtle);

    &--short { width: 35%; }
    &--value { width: 65%; height: 1.5rem; }
  }

  &__loading-caption { color: token(--text-secondary); font-size: var(--font-sm); }

  &__empty { padding: var(--space-8) 0; }

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

  &__kpis {
    display: grid;
    grid-template-columns: 1fr;

    @include up(sm) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    @include up(lg) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }

  /*
   * Die Assetklassen-Balken bleiben dem Desktop vorbehalten: Auf dem Telefon
   * stehen dieselben Zahlen ohnehin über jeder Gruppe in der Kartenliste.
   */
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
  &__table-area { @include stack(0); }

  &__groups {
    display: none;
    border-top: 1px solid token(--border-default);

    @include up(md) { display: block; }
  }

  &__groups-toggle {
    @include row;

    width: 100%;
    padding: 0.625rem 0;
    text-align: left;
    color: token(--text-secondary);
    transition: color 0.15s ease;

    &:hover { color: token(--text-primary); }
  }


  &__section-title {
    font-size: var(--font-xs);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  &__summary {
    @include row(var(--space-3));

    margin-left: auto;
    font-size: var(--font-xs);
  }

  &__summary-item {
    display: none;

    @include up(sm) { display: inline; }

    &--ok { @include muted(null); }
    &--flagged { color: token(--status-near); }
  }

  &__group-list {
    @include stack(0);

    padding-bottom: var(--space-4);

    > * + * { border-top: 1px solid token(--border-subtle); }
  }

  &__panel {
    @include up(md) {
      overflow: hidden;
      border: 1px solid token(--border-default);
      border-radius: 0.75rem;
      background-color: token(--surface-card);
    }
  }

  /*
   * Die Trennlinie sitzt am Kopf, nicht als eigener Divider dazwischen.
   * Naives `NDivider` bringt 24 px Abstand nach oben und unten mit — 49 px
   * Leerfläche um einen 1 px-Strich, und das `!my-0` daran war eine
   * Tailwind-Utility, die es seit dessen Ausbau nicht mehr gibt.
   */
  &__panel-head {
    @include row(var(--space-4));

    flex-wrap: wrap;
    justify-content: space-between;
    padding: 0 0 var(--space-2);

    @include up(md) {
      padding: var(--space-4) 1.25rem;
      border-bottom: 1px solid token(--border-default);
    }
  }

  &__panel-title {
    font-size: var(--font-xs);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: token(--text-secondary);
  }

  &__panel-heading { @include row(var(--space-2)); }
  &__group-actions { @include row(0); }

  &__group-action {
    display: inline-grid;
    place-items: center;
    width: 1.5rem;
    height: 1.75rem;
    padding: 0;
    color: token(--text-muted);
    cursor: pointer;

    &:hover { color: token(--text-primary); }
    &:focus-visible { outline: 2px solid token(--text-primary); outline-offset: 2px; }
  }

  &__group-symbol { display: block; width: 1rem; height: 1rem; }

  &__panel-meta { @include row(1.25rem); }

  &__bands { @include muted; }

  &__hint { margin-left: var(--space-1); }

  &__schedule { margin-left: var(--space-2); }

  &__due { color: token(--status-out); }
}
</style>
