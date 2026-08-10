<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NAlert, NButton, NEmpty, NSpin, NTooltip } from 'naive-ui'
import DeltaBar from '@/components/DeltaBar.vue'
import InlineNumber from '@/components/InlineNumber.vue'
import SuggestionBadge from '@/components/SuggestionBadge.vue'
import { assetColor } from '@/domain/assetColors'
import { eur, eurCent, eurSigned, integer, percent, percentSigned } from '@/domain/formatters'
import { computeRebalancing, type GroupResult } from '@/domain/rebalancing'
import {
  computeTradePlan,
  hasTrades,
  type TargetMap,
  type TradeMap,
} from '@/domain/tradePlan'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { useQuotesStore } from '@/stores/quotes'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'
import type { AssetGroup } from '@/types/portfolio'

const { t } = useI18n()

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT)

const portfolioStore = usePortfolioStore()
const settingsStore = useSettingsStore()
const quotesStore = useQuotesStore()

const ready = computed(() => portfolioStore.loaded && settingsStore.loaded)
const hasHoldings = computed(() => portfolioStore.hasHoldings)

const result = computed(() => {
  const portfolio = portfolioStore.portfolio
  if (!portfolio) return null
  return computeRebalancing(portfolio, quotesStore.quotes, settingsStore.settings)
})

onMounted(async () => {
  if (!portfolioStore.loaded) await portfolioStore.load()
  if (!settingsStore.loaded) await settingsStore.load(portfolioStore.portfolio?.id ?? '')
  await quotesStore.hydrate()
  if (settingsStore.settings.refresh.autoOnLoad && client) {
    await quotesStore.loadQuotes(client, portfolioStore.positions)
  }
})

// ─── Der Plan ───────────────────────────────────────────────────────────────

const trades = ref<TradeMap>({})

/**
 * Probeweise Ziele — leben nur in diesem Tab.
 *
 * Das Rebalancing ist eine Simulation. Ins Depot wandert eine Zieländerung
 * erst, wenn die Trades wirklich durch sind; das macht man dann selbst im
 * Dashboard. Bis dahin darf hier nichts am Bestand oder am Ziel hängen bleiben.
 */
const targets = ref<TargetMap>({})

const plan = computed(() => {
  const portfolio = portfolioStore.portfolio
  if (!portfolio || !result.value) return null
  return computeTradePlan(
    result.value.rows,
    trades.value,
    result.value.total,
    settingsStore.settings.bands,
    settingsStore.settings.securityBuffer,
    targets.value,
  )
})

const planHasEntries = computed(
  () => hasTrades(trades.value) || Object.keys(targets.value).length > 0,
)

/** Weichen die probeweisen Ziele in Summe von 100 % ab? */
const targetSumOff = computed(
  () => plan.value !== null && Math.abs(plan.value.targetSum - 100) > 0.01,
)

function setTrade(positionId: string, units: number): void {
  trades.value = { ...trades.value, [positionId]: units }
}

function setTarget(positionId: string, targetPercent: number): void {
  targets.value = { ...targets.value, [positionId]: targetPercent }
}

function clearPlan(): void {
  trades.value = {}
  targets.value = {}
}

// ─── Gliederung nach Assetklasse ────────────────────────────────────────────

interface RenderedGroup {
  group: GroupResult
  rows: NonNullable<typeof plan.value>['rows']
}

const groupedRows = computed<RenderedGroup[]>(() => {
  if (!plan.value || !result.value) return []
  return result.value.groups
    .map((group) => ({
      group,
      rows: plan.value!.rows.filter((row) => row.current.position.group === group.group),
    }))
    .filter((entry) => entry.rows.length > 0)
})

function bandColor(group: AssetGroup): string {
  return `color-mix(in srgb, ${assetColor(group)} 7%, transparent)`
}

/**
 * Abweichung vom Ziel, für die Anzeige: „Ziel 10 %, danach 9,5 %" → „−0,5 %".
 *
 * Gemeint sind Prozentpunkte, aber der Zusatz „%-P" stand als Fachkürzel in
 * jeder Zeile, ohne etwas zu klären — die Spaltenüberschrift sagt es bereits.
 */
function deviationLabel(row: NonNullable<typeof plan.value>['rows'][number]): string {
  return percentSigned(row.deviationAfter)
}

/** Kurs je Stück — für die Anzeige in der Zeile. */
function priceOf(row: NonNullable<typeof plan.value>['rows'][number]): number | null {
  if (row.current.position.group === 'cash') return null
  return row.current.quote?.price ?? null
}
</script>

<template>
  <div class="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col gap-4 md:gap-6">
    <div v-if="!ready" class="flex items-center justify-center py-24">
      <NSpin size="large" />
    </div>

    <NEmpty
      v-else-if="!hasHoldings"
      class="py-24"
      description="Noch keine Wertpapiere im Depot"
    />

    <template v-else-if="plan && result">
      <!--
        Kopf: woher kommt das Geld, wohin geht es.
        Kein abstraktes Budget — jeder eingesetzte Euro muss im Plan aus einem
        Verkauf oder einer Entnahme bei Cash/Geldmarkt stammen.
      -->
      <section class="flex flex-wrap items-end gap-x-8 gap-y-4">
        <div class="flex flex-col gap-0.5">
          <span class="text-[11px] uppercase tracking-wide text-ink-muted">Frei gemacht</span>
          <span class="text-lg font-semibold tabular-nums text-status-ok">
            {{ eur(plan.proceeds) }}
          </span>
          <span class="text-[11px] text-ink-muted">Verkäufe und Entnahmen</span>
        </div>

        <div class="flex flex-col gap-0.5">
          <span class="text-[11px] uppercase tracking-wide text-ink-muted">Eingesetzt</span>
          <span class="text-lg font-semibold tabular-nums text-status-out">
            {{ eur(plan.outlay) }}
          </span>
          <span class="text-[11px] text-ink-muted">Käufe</span>
        </div>

        <div class="flex flex-col gap-0.5">
          <span class="text-[11px] uppercase tracking-wide text-ink-muted">Bilanz</span>
          <span
            class="text-lg font-semibold tabular-nums"
            :class="plan.underfunded ? 'text-status-out' : 'text-ink'"
          >
            {{ eurSigned(plan.netCashFlow) }}
          </span>
          <span class="text-[11px] text-ink-muted">
            <template v-if="!planHasEntries">noch nichts geplant</template>
            <template v-else-if="plan.underfunded">nicht gedeckt</template>
            <template v-else-if="Math.abs(plan.netCashFlow) < 0.005">geht auf</template>
            <template v-else>bleibt übrig</template>
          </span>
        </div>

        <div class="flex flex-col gap-0.5">
          <span class="text-[11px] uppercase tracking-wide text-ink-muted">
            Aus Reserve entnehmbar
          </span>
          <span class="text-lg font-semibold tabular-nums">{{ eur(plan.reserveAvailable) }}</span>
          <span class="text-[11px] text-ink-muted">
            Cash + Geldmarkt über dem Puffer
          </span>
        </div>

        <div class="ml-auto flex items-center gap-3">
          <!--
            Der Plan bucht bewusst nichts. Er dient dem Durchrechnen; die
            Aufträge gibt der Nutzer bei seiner Bank auf und pflegt die
            Bestände danach im Dashboard nach.
          -->
          <span class="text-[11px] text-ink-muted max-w-[16rem] leading-tight">
            Alles hier ist Simulation — weder Bestände noch Ziele werden
            geändert.
          </span>
          <NButton size="small" quaternary :disabled="!planHasEntries" @click="clearPlan">
            Plan leeren
          </NButton>
        </div>
      </section>

      <!-- ─── Der Plan ─────────────────────────────────────────────────── -->
      <section class="rounded-xl border border-edge bg-card overflow-hidden">
        <div class="px-4 md:px-5 py-3 flex items-baseline justify-between gap-4 flex-wrap">
          <h2 class="text-xs uppercase tracking-wide text-ink-muted font-medium">
            Verkaufen und kaufen — Stückzahlen eintragen
          </h2>
          <span class="text-xs text-ink-muted tabular-nums">
            Bänder: −{{ percent(settingsStore.settings.bands.lowerPercent) }} /
            +{{ percent(settingsStore.settings.bands.upperPercent) }}
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-[11px] uppercase tracking-wide text-ink-muted">
                <th class="text-left font-medium px-4 py-1.5">Symbol</th>
                <th class="text-right font-medium px-2 py-1.5">Bestand</th>
                <th class="text-right font-medium px-2 py-1.5">Kurs</th>
                <th class="text-right font-medium px-2 py-1.5">IST %</th>
                <th class="text-right font-medium px-2 py-1.5">Ziel %</th>
                <th class="text-right font-medium px-2 py-1.5">
                  <NTooltip trigger="hover">
                    <template #trigger>
                      <span class="border-b border-dotted border-ink-muted cursor-help">
                        Delta
                      </span>
                    </template>
                    <div class="max-w-xs text-sm">
                      Stückzahl bis zum Ziel: positiv kaufen, negativ verkaufen.
                      Anklicken übernimmt den Wert in die Eingabe.
                      <div class="mt-2 text-xs">
                        Ergeben die Ziel-Anteile zusammen 100 %, heben sich alle
                        Deltas gegenseitig auf — wer allen folgt, bekommt einen
                        Plan, der von selbst aufgeht.
                      </div>
                    </div>
                  </NTooltip>
                </th>
                <th class="text-right font-medium px-2 py-1.5 w-32">Kauf / Verkauf</th>
                <th class="text-right font-medium px-2 py-1.5 w-28">Wert</th>
                <th class="text-left font-medium px-2 py-1.5 w-56">Anteil nachher</th>
                <th class="text-right font-medium px-2 py-1.5">Abw. Ziel</th>
                <th class="text-left font-medium px-4 py-1.5 w-32">Status</th>
              </tr>
            </thead>

            <tbody>
              <template v-for="entry in groupedRows" :key="entry.group.group">
                <tr :style="{ backgroundColor: bandColor(entry.group.group) }">
                  <td colspan="11" class="px-4 py-1">
                    <span class="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ink-muted">
                      <span
                        class="inline-block w-1.5 h-1.5 rounded-full"
                        :style="{ backgroundColor: assetColor(entry.group.group) }"
                        aria-hidden="true"
                      ></span>
                      {{ t(`groups.${entry.group.group}`) }}
                    </span>
                  </td>
                </tr>

                <tr
                  v-for="row in entry.rows"
                  :key="row.current.position.id"
                  class="border-t border-edge-subtle"
                >
                  <td class="px-4 py-1">
                    <div class="font-medium leading-tight">
                      {{
                        row.current.position.group === 'cash'
                          ? row.current.position.displayName
                          : row.current.position.symbol
                      }}
                    </div>
                    <div
                      v-if="row.current.position.group !== 'cash'"
                      class="text-xs text-ink-muted truncate max-w-[14rem]"
                    >
                      {{ row.current.position.displayName }}
                    </div>
                  </td>

                  <td class="px-2 py-1 text-right tabular-nums">
                    {{ integer(row.current.position.units) }}
                  </td>

                  <td class="px-2 py-1 text-right tabular-nums text-ink-secondary">
                    {{ priceOf(row) !== null ? eurCent(priceOf(row)!) : '—' }}
                  </td>

                  <td class="px-2 py-1 text-right tabular-nums text-ink-secondary">
                    {{ percent(row.current.actualPercent) }}
                  </td>

                  <!--
                    Ziel probeweise änderbar — nur in dieser Simulation.
                    Wer eine Position als Geldquelle nutzt, obwohl sie auf Ziel
                    steht, ändert damit seine Aufteilung; ohne angepasstes Ziel
                    stünde die Zeile hinterher dauerhaft auf „Kaufen". Der
                    Punkt markiert den Probewert.
                  -->
                  <td class="px-2 py-1">
                    <div class="flex items-center gap-1">
                      <span
                        class="w-1.5 h-1.5 rounded-full shrink-0"
                        :class="row.targetOverridden ? 'bg-accent' : 'bg-transparent'"
                        :title="
                          row.targetOverridden
                            ? `Probeweise geändert — im Depot steht ${percent(
                              row.current.position.targetPercent,
                            )}`
                            : ''
                        "
                        aria-hidden="true"
                      ></span>
                      <InlineNumber
                        class="flex-1"
                        :value="row.targetPercent"
                        :display="percent(row.targetPercent)"
                        :precision="2"
                        :min="0"
                        :max="100"
                        @commit="
                          (targetPercent: number) =>
                            setTarget(row.current.position.id, targetPercent)
                        "
                      />
                    </div>
                  </td>

                  <!-- Delta bis zum Ziel — per Klick übernehmbar -->
                  <td class="px-2 py-1 text-right">
                    <button
                      v-if="row.deltaUnits !== 0"
                      type="button"
                      class="tabular-nums text-xs underline decoration-dotted"
                      :class="row.deltaUnits > 0 ? 'text-status-ok' : 'text-status-out'"
                      title="In die Eingabe übernehmen"
                      @click="setTrade(row.current.position.id, row.deltaUnits)"
                    >
                      {{ row.deltaUnits > 0 ? '+' : '' }}{{ integer(row.deltaUnits) }}
                    </button>
                    <span v-else class="text-ink-muted text-xs">—</span>
                  </td>

                  <!-- Die Eingabe -->
                  <td class="px-2 py-1">
                    <InlineNumber
                      :value="row.tradeUnits"
                      :display="row.tradeUnits === 0 ? '—' : integer(row.tradeUnits)"
                      :precision="row.current.position.group === 'cash' ? 2 : 0"
                      :min="-row.current.position.units"
                      @commit="(units: number) => setTrade(row.current.position.id, units)"
                    />
                  </td>

                  <td
                    class="px-2 py-1 text-right tabular-nums"
                    :class="
                      row.cashFlow > 0
                        ? 'text-status-ok'
                        : row.cashFlow < 0
                          ? 'text-status-out'
                          : 'text-ink-muted'
                    "
                  >
                    {{ row.cashFlow === 0 ? '—' : eurSigned(row.cashFlow) }}
                  </td>

                  <td class="px-2 py-1">
                    <!--
                      Derselbe Balken wie auf dem Dashboard: Mitte ist das
                      Ziel. Zusätzlich die gestrichelte Marke der Ausgangslage
                      und statt des Deltas der Anteil am Gesamtvermögen.
                    -->
                    <DeltaBar
                      :relative-percent="row.relativeDeviationAfter"
                      :before="row.relativeDeviationBefore"
                      :bands="settingsStore.settings.bands"
                      :label="percent(row.percentAfter)"
                      compact
                    />
                  </td>

                  <!--
                    Abweichung vom Ziel nach dem Trade. Das Ziel muss nicht
                    exakt getroffen werden — solange der Anteil im Band liegt,
                    ist der Zustand in Ordnung, deshalb hier gedämpft statt rot.
                  -->
                  <td
                    class="px-2 py-1 text-right tabular-nums"
                    :class="row.inBandAfter ? 'text-ink-muted' : 'text-status-out'"
                    :title="`${percentSigned(row.relativeDeviationAfter)} relativ zum Ziel`"
                  >
                    {{ row.tradeUnits === 0 && row.deviationAfter === 0 ? '—' : deviationLabel(row) }}
                  </td>

                  <td class="px-4 py-1">
                    <SuggestionBadge :suggestion="row.suggestionAfter" />
                  </td>
                </tr>
              </template>
            </tbody>

            <!-- Bilanz des Plans -->
            <tfoot>
              <tr class="border-t border-edge">
                <td colspan="7" class="px-4 py-2 text-right text-xs uppercase tracking-wide text-ink-muted">
                  Geht der Plan auf?
                </td>
                <td
                  class="px-2 py-2 text-right tabular-nums font-semibold"
                  :class="
                    Math.abs(plan.netCashFlow) < 0.005 ? 'text-status-ok' : 'text-ink'
                  "
                >
                  {{ eurSigned(plan.netCashFlow) }}
                </td>
                <td class="px-2 py-2 text-xs text-ink-muted" colspan="3">
                  <template v-if="!planHasEntries">Noch nichts geplant.</template>
                  <template v-else-if="Math.abs(plan.netCashFlow) < 0.005">
                    Käufe und Verkäufe gleichen sich aus.
                  </template>
                  <template v-else-if="plan.netCashFlow < 0">
                    {{ eur(-plan.netCashFlow) }} kommen aus der Reserve.
                  </template>
                  <template v-else>
                    {{ eur(plan.netCashFlow) }} bleiben übrig.
                  </template>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <!--
        Warnungen **unter** der Tabelle.

        Darüber verschoben sie bei jeder Eingabe die ganze Tabelle nach unten —
        genau während man Zahlen eintippt. Unten wächst der Block ins Leere.
        Dass etwas nicht stimmt, sagt außerdem schon die Bilanz im Kopf.
      -->
      <NAlert v-if="plan.underfunded" type="error" :bordered="false">
        Für die geplanten Käufe fehlen {{ eur(-plan.netCashFlow) }}. Verkaufe ein
        Papier oder entnimm aus Cash bzw. Geldmarkt — trage die Entnahme dort als
        negative Zahl ein.
      </NAlert>

      <!--
        Probeweise Ziele dürfen sich verschieben, aber nicht die Summe sprengen:
        was eine Position mehr bekommt, muss eine andere abgeben.
      -->
      <NAlert v-if="targetSumOff" type="warning" :bordered="false">
        Die Ziele ergeben zusammen {{ percent(plan.targetSum) }} statt 100 %.
        Was eine Position zusätzlich bekommen soll, muss eine andere abgeben.
      </NAlert>

      <NAlert v-if="plan.bufferBreached" type="warning" :bordered="false">
        Der Plan senkt Cash und Geldmarkt auf {{ eur(plan.liquidAfter) }} und
        unterschreitet damit den Sicherheitspuffer von
        {{ eur(settingsStore.settings.securityBuffer) }}.
      </NAlert>
    </template>
  </div>
</template>
