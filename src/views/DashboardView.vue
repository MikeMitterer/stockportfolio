<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { UxCaret } from '@mmit/ux-foundation'
import { useI18n } from 'vue-i18n'
import { NSpin, NEmpty, NButton } from 'naive-ui'
import InfoHint from '@/components/InfoHint.vue'
import KpiCard from '@/components/KpiCard.vue'
import PortfolioValueChart from '@/components/PortfolioValueChart.vue'
import { useHistoryStore } from '@/stores/history'
import { useValueHistoryStore } from '@/stores/valueHistory'
import { withinDays, type BacktestInput } from '@/domain/portfolioHistory'
import GroupBar from '@/components/GroupBar.vue'
import PositionsTable from '@/components/PositionsTable.vue'
import { eur, eurSigned, integer, percent, shortDate } from '@/domain/formatters'
import { computeRebalancing } from '@/domain/rebalancing'
import { nextDueDate, usesBands } from '@/domain/schedule'
import AddPositionDialog from '@/components/AddPositionDialog.vue'
import TargetAllocationBar from '@/components/TargetAllocationBar.vue'
import PositionCardList from '@/components/PositionCardList.vue'
import { safeStorage, useIsCompact } from '@mmit/ux-foundation'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { useAppNotification } from '@/composables/useAppNotification'
import { useQuotesStore } from '@/stores/quotes'
import { useInstrumentsStore } from '@/stores/instruments'
import { newId } from '@/db/seed'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'
import type { InstrumentSummary } from '@/api/types'
import type { AssetGroup, Position } from '@/types/portfolio'

const { t } = useI18n()

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT)
if (!client) throw new Error('StockInfoClient wurde nicht bereitgestellt')

const portfolioStore = usePortfolioStore()
const settingsStore = useSettingsStore()
const quotesStore = useQuotesStore()
const instrumentsStore = useInstrumentsStore()

// Unterhalb von `md` tritt die Leseansicht an die Stelle der Tabelle. Die
// Grenze steht im Fundament — dieselbe, an der auch die SCSS-Mixins kippen.
const isCompact = useIsCompact()

const loading = computed(() => quotesStore.loading)
const failures = computed(() => quotesStore.failures)

const ready = computed(() => portfolioStore.loaded && settingsStore.loaded)
const hasHoldings = computed(() => portfolioStore.hasHoldings)

const demoLoading = ref<boolean>(false)

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

const result = computed(() => {
  const portfolio = portfolioStore.portfolio
  if (!portfolio) return null
  return computeRebalancing(portfolio, quotesStore.quotes, settingsStore.settings)
})

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
const incompleteCount = computed(() => failures.value.length + foreignCurrencyRows.value.length)

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
        base: settingsStore.settings.currency,
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
  if (!instrumentsStore.loaded && client) await instrumentsStore.load(client)
  showAddDialog.value = true
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
    kind: instrument.type === 'etf' || instrument.type === 'stock' ? instrument.type : null,
    displayName: instrument.name ?? instrument.symbol,
    group,
    units,
    targetPercent,
    enabled: true,
  })

  if (client) await quotesStore.loadQuotes(client, portfolioStore.positions)
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
const backtestInputs = computed<BacktestInput[]>(() =>
  (result.value?.rows ?? [])
    .filter((row) => row.isActive)
    .map((row) => ({
      units: row.position.units,
      points: historyStore.get(row.position, BACKTEST_PERIOD).points,
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
    await valueHistory.load(portfolio.id)

    await Promise.all(
      portfolioStore.positions
        .filter((position) => position.enabled)
        .map((position) => historyStore.ensure(client ?? null, position, BACKTEST_PERIOD)),
    )

    valueHistory.computeBacktest(backtestInputs.value)
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

  await portfolioStore.load()
  await settingsStore.load(portfolioStore.portfolio?.id ?? '')

  // Zuerst den persistierten Cache zeigen, dann im Hintergrund aktualisieren.
  await quotesStore.hydrate()

  if (settingsStore.settings.refresh.autoOnLoad && client) {
    await quotesStore.loadQuotes(client, portfolioStore.positions)
  }

  // Ältere Positionen kennen ihre Gattung nicht — jetzt, wo die Kurse da
  // sind, lässt sie sich ableiten und dauerhaft festhalten.
  await portfolioStore.backfillKinds(quotesStore.quotes)

  // Der Tageswert wird festgehalten, sobald die Kurse stehen — einmal je Tag.
  const total = result.value?.total ?? 0
  await valueHistory.record(portfolioStore.portfolio?.id ?? '', total)
  await loadValueHistory()
})

watch(groupsCollapsed, (collapsed) => {
  safeStorage.write(GROUPS_COLLAPSED_KEY, collapsed ? '1' : '0')
})

function toggleGroups(): void {
  groupsCollapsed.value = !groupsCollapsed.value
}
</script>

<template>
  <div class="dashboard">
    <!-- Erst-Ladezustand -->
    <div v-if="!ready" class="dashboard__loading">
      <NSpin size="large" />
    </div>

    <!--
      Leeres Depot: kein Rebalancing möglich, aber auch keine Sackgasse —
      das Beispiel-Depot lässt die App ausprobieren, ohne dass jemand
      fremde Bestände für die eigenen hält.
    -->
    <NEmpty v-else-if="!hasHoldings" class="dashboard__empty" description="Noch keine Wertpapiere im Depot">
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
          :value="eur(result.total)"
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
          :value="eurSigned(result.liquidity.investmentReserve)"
          :hint="t('kpi.investmentReserveHint')"
          :tone="liquidityTone"
        />
        <KpiCard
          :label="t('kpi.investmentReservePercent')"
          :explanation="t('hints.securityBuffer')"
          anchor="reserve"
          settings-tab="calc"
          :value="percent(result.liquidity.investmentReservePercent)"
          :hint="t('kpi.securityBufferHint', { buffer: eur(result.liquidity.securityBuffer) })"
        />
        <!--
          Beschreibt die Datenlage, nicht den Handlungsbedarf: Ein „Buy" in der
          Zeile ist ein normaler Zustand, ein fehlender Kurs eine Lücke. Ohne
          den Hinweis läse sich die Kennzahl neben fünf Buy-Zeilen wie ein
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
                v-for="group in result.groups"
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
            <GroupBar v-for="group in result.groups" :key="group.group" :group="group" />
          </div>
        </section>

        <!-- Positionen -->
        <section class="dashboard__panel">
          <div class="dashboard__panel-head">
            <h2 class="dashboard__panel-title">
              {{ isCompact ? t('dashboard.positionsShort') : t('dashboard.positionsHeading') }}
            </h2>
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
              <NButton v-if="!isCompact" size="tiny" secondary @click="openAddDialog">
                {{ t('actions.addPosition') }}
              </NButton>
            </div>
          </div>

          <PositionCardList v-if="isCompact" :rows="result.rows" :groups="result.groups" />

          <PositionsTable
            v-else
            :rows="result.rows"
            :groups="result.groups"
            :total="result.total"
            :targets-exceeded="result.targetsExceeded"
            :links="settingsStore.settings.links"
            @update="onUpdate"
            @remove="onRemove"
            @refresh="onRefreshOne"
          />
        </section>
      </div>
    </template>

    <AddPositionDialog
      v-model:show="showAddDialog"
      :available="instrumentsStore.allowedInstruments"
      :existing-keys="existingKeys"
      :remaining-target-percent="remainingTargetPercent"
      @add="onAddPosition"
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
    @include row(0);

    justify-content: center;
    padding: var(--space-8) 0;
  }

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

  &__empty-buttons { @include row; }

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
    overflow: hidden;
    border: 1px solid token(--border-default);
    border-radius: 0.75rem;
    background-color: token(--surface-card);
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
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid token(--border-default);

    @include up(md) { padding: var(--space-4) 1.25rem; }
  }

  &__panel-title {
    font-size: var(--font-xs);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: token(--text-secondary);
  }

  &__panel-meta { @include row(1.25rem); }

  &__bands { @include muted; }

  &__hint { margin-left: var(--space-1); }

  &__schedule { margin-left: var(--space-2); }

  &__due { color: token(--status-out); }
}
</style>
