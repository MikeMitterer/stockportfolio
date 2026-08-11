/**
 * Reine Berechnungsfunktionen für Tolerance-Band-Rebalancing.
 * 1:1 abgeleitet aus der Excel-Vorlage (Spalten K, L, R, Q, S, U, X, Y, Z, AC).
 *
 * Kein DOM, kein Reactivity, keine API — vollständig unit-testbar.
 */

import { resolveAmount } from './amount'
import { daysUntilDue, isDue, usesBands, usesCalendar } from './schedule'
import type {
  AssetGroup,
  RebalancingTrigger,
  Bands,
  Portfolio,
  Position,
  QuoteCacheEntry,
  QuoteMap,
  Settings,
  Suggestion,
} from '@/types/portfolio'

/** Cache-Key-Konvention: ISIN bevorzugt, Symbol als Fallback. */
export function quoteKey(position: Pick<Position, 'isin' | 'symbol'>): string {
  return position.isin ?? position.symbol
}

/** Kurs zu einer Position aus der QuoteMap holen (kann `null` sein für Cash). */
export function quoteFor(position: Position, quotes: QuoteMap): QuoteCacheEntry | null {
  if (position.group === 'cash') return null
  return quotes.get(quoteKey(position)) ?? null
}

/**
 * Marktwert einer Position in EUR (Excel Spalte K = G × I).
 * Für Cash: `units` ist der EUR-Betrag selbst.
 * Für Wertpapiere: `units × Kurs`. Kein Kurs → 0 (mit Warning).
 */
export function marketValue(position: Position, quote: QuoteCacheEntry | null): number {
  if (position.group === 'cash') return position.units
  if (!quote) return 0
  return position.units * quote.price
}

/** Marktwert-Summe aller aktiven Positionen einer Gruppe. */
export function groupMarketValue(
  group: AssetGroup,
  portfolio: Portfolio,
  quotes: QuoteMap,
  baseCurrency = 'EUR',
): number {
  return portfolio.positions
    .filter((position) => position.group === group && countsIn(position, quotes, baseCurrency))
    .reduce((sum, position) => sum + marketValue(position, quoteFor(position, quotes)), 0)
}

/**
 * Gesamtsumme des Portfolios (Excel I3 = ROUND(K7+K14+K16+K19, -3)).
 * Rundung auf `settings.totalRounding` (z.B. -3 → Tausender).
 */
export function totalValue(
  portfolio: Portfolio,
  quotes: QuoteMap,
  rounding: number,
  baseCurrency = 'EUR',
): number {
  const raw = portfolio.positions
    .filter((position) => countsIn(position, quotes, baseCurrency))
    .reduce((sum, position) => sum + marketValue(position, quoteFor(position, quotes)), 0)
  return roundToPlace(raw, rounding)
}

/**
 * Notiert das Papier in einer anderen Währung als der Basiswährung?
 *
 * Solche Positionen dürfen nicht in die Summen: 10.000 USD plus 10.000 EUR
 * ergibt keine 20.000 von irgendetwas. Die App rechnet in genau einer Währung
 * und sagt es, wenn etwas nicht hineinpasst — statt eine Zahl zu zeigen, die
 * niemand nachrechnen kann.
 *
 * Ohne Kurs gilt keine Abweichung: Dann fehlt schlicht die Angabe, und die
 * fehlende Kursmeldung ist bereits ihr eigener Hinweis.
 *
 * Achtung, das ist die **Notierungswährung**, nicht das Währungsrisiko: Ein
 * EUR-notierter MSCI World steckt zu zwei Dritteln in US-Dollar. Diese
 * Unterscheidung kann die App nicht treffen und behauptet sie auch nicht.
 *
 * @param quote        Kurs der Position, oder `null`.
 * @param baseCurrency Währung, in der gerechnet wird.
 */
export function hasForeignCurrency(
  quote: QuoteCacheEntry | null,
  baseCurrency: string,
): boolean {
  if (!quote || !quote.currency) return false
  return quote.currency.toUpperCase() !== baseCurrency.toUpperCase()
}

/**
 * Zählt die Position in Summen und Anteile?
 *
 * Zwei Gründe schließen sie aus: Der Nutzer hat sie abgeschaltet, oder sie
 * notiert in einer fremden Währung. Beide Male bleibt die Zeile sichtbar —
 * unsichtbare Ausschlüsse sind schlimmer als falsche Summen, weil man sie
 * nicht einmal suchen kann.
 */
function countsIn(
  position: Position,
  quotes: QuoteMap,
  baseCurrency: string,
): boolean {
  return position.enabled && !hasForeignCurrency(quoteFor(position, quotes), baseCurrency)
}

/** IST-% am Gesamtvermögen (Excel L = K × 100 / I3). */
export function actualPercent(marketValueEur: number, total: number): number {
  if (total === 0) return 0
  return (marketValueEur * 100) / total
}

/** Ziel-Wert einer Position in EUR (Excel R = I3 / 100 × M). */
export function targetValue(position: Position, total: number): number {
  return (total * position.targetPercent) / 100
}

/** Untere Bandgrenze in EUR (Excel Q = R − R × G22 %). */
export function lowerBand(target: number, bands: Bands): number {
  return target * (1 - bands.lowerPercent / 100)
}

/** Obere Bandgrenze in EUR (Excel S = R + R × H22 %). */
export function upperBand(target: number, bands: Bands): number {
  return target * (1 + bands.upperPercent / 100)
}

/** Vorschlag: `sell` wenn MW über Upper, `buy` wenn unter Lower, sonst `ok`. */
export function suggestion(marketValueEur: number, low: number, high: number): Suggestion {
  if (marketValueEur > high) return 'sell'
  if (marketValueEur < low) return 'buy'
  return 'ok'
}

/** Relatives Delta in % (Excel X = IF(R<>0, U × 100 / R, 100)). Positiv = übergewichtet. */
export function relativeDeltaPercent(actualEur: number, targetEur: number): number {
  if (targetEur === 0) return 0
  return ((actualEur - targetEur) * 100) / targetEur
}

/** Anzahl Stück, um die die Position vom Ziel abweicht (Excel Z = U / I × -1). */
export function unitsDelta(
  actualEur: number,
  targetEur: number,
  quote: QuoteCacheEntry | null,
): number {
  if (!quote || quote.price === 0) return 0
  return (targetEur - actualEur) / quote.price
}

/**
 * Rundet analog zu Excel `ROUND(value, place)`:
 * - place = 0 → auf Ganze
 * - place = -2 → auf 100er
 * - place = -3 → auf 1000er
 * - place = 2 → auf 2 Nachkommastellen
 */
export function roundToPlace(value: number, place: number): number {
  const factor = Math.pow(10, -place)
  return Math.round(value / factor) * factor
}

/**
 * Ist die Position „nahe" der Bandgrenze (Vorwarnstufe, gelber Badge)?
 * Kriterium: relatives Delta ist innerhalb 1 %-Punkt der Bandgrenze.
 */
export function isNearBand(actualEur: number, low: number, high: number, target: number): boolean {
  if (target === 0) return false
  if (actualEur < low || actualEur > high) return false
  const upperMargin = ((high - actualEur) * 100) / target
  const lowerMargin = ((actualEur - low) * 100) / target
  return upperMargin <= 1 || lowerMargin <= 1
}

// ────────────────────────────────────────────────────────────────────────────
// Aggregator
// ────────────────────────────────────────────────────────────────────────────

/**
 * Unterdrückt ein Signal, für das sich keine Order lohnt.
 *
 * Relative Bänder machen kleine Positionen empfindlich — das ist ihr Zweck,
 * sonst wären sie nie an der Reihe. In Euro gerechnet kippt derselbe Vorzug
 * aber: Ein Ziel von 2 % gibt bei einem Band von 6 % schon bei 120 € ein
 * Signal, und dafür lohnt keine Order. Wer solchen Signalen nicht folgt,
 * gewöhnt sich an, Signale zu übergehen — das ist schlimmer als keines.
 *
 * Die Abweichung bleibt sichtbar; nur der Handlungsbedarf entfällt.
 *
 * @param suggestion Ergebnis des Bandvergleichs.
 * @param deltaEuro  Abstand zum Zielwert in Euro (Vorzeichen egal).
 * @param minTrade   Mindestbetrag; `0` schaltet die Prüfung ab.
 */
export function applyMinTrade(
  suggestion: Suggestion,
  deltaEuro: number,
  minTrade: number,
): { suggestion: Suggestion; belowMinTrade: boolean } {
  if (suggestion === 'ok' || minTrade <= 0) return { suggestion, belowMinTrade: false }
  if (Math.abs(deltaEuro) >= minTrade) return { suggestion, belowMinTrade: false }
  return { suggestion: 'ok', belowMinTrade: true }
}

/**
 * Urteil ohne Band: Am Termin zählt jede Abweichung vom Ziel.
 *
 * @param marketValue Aktueller Marktwert.
 * @param target      Zielwert in Euro.
 */
export function calendarSuggestion(marketValue: number, target: number): Suggestion {
  if (marketValue < target) return 'buy'
  if (marketValue > target) return 'sell'
  return 'ok'
}

/**
 * Führt Band- und Terminurteil zusammen.
 *
 * Bei `both` gilt beides nebeneinander: Das Band meldet laufend, der Termin
 * nimmt zusätzlich die kleineren Abweichungen mit. Vorrang hat das Band —
 * es ist die schärfere Aussage und war zuerst da.
 *
 * @param bandVerdict Urteil aus den Toleranzbändern.
 * @param trigger     Eingestellter Auslöser.
 * @param due         Ist der Termin erreicht?
 * @param marketValue Aktueller Marktwert.
 * @param target      Zielwert in Euro.
 */
export function combineSuggestion(
  bandVerdict: Suggestion,
  trigger: RebalancingTrigger,
  due: boolean,
  marketValue: number,
  target: number,
): Suggestion {
  const fromBands = usesBands(trigger) ? bandVerdict : 'ok'
  if (fromBands !== 'ok') return fromBands
  if (usesCalendar(trigger) && due) return calendarSuggestion(marketValue, target)
  return 'ok'
}

export interface PositionResult {
  position: Position
  quote: QuoteCacheEntry | null
  marketValue: number
  actualPercent: number
  targetValue: number
  lowerBand: number
  upperBand: number
  suggestion: Suggestion
  unitsDelta: number
  relativeDeltaPercent: number
  isNearBand: boolean
  /**
   * Zählt die Position in die Berechnung?
   *
   * Ausgeschlossene Positionen erscheinen weiterhin in der Liste — sonst
   * wären sie unerreichbar, und ein unsichtbarer Ausschluss ist schlimmer als
   * eine falsche Summe: Man kann ihn nicht einmal suchen.
   */
  isActive: boolean
  /**
   * Warum die Position nicht mitzählt — `null`, wenn sie es tut.
   *
   * Getrennt von `isActive`, weil die Oberfläche den Grund nennen muss:
   * „abgeschaltet" ist eine Entscheidung des Nutzers, „fremde Währung" ein
   * Zustand, den er so nicht gewollt hat.
   */
  excludedReason: 'disabled' | 'currency' | null
  /**
   * Die Position liegt außerhalb ihres Bandes, aber der nötige Trade wäre
   * kleiner als das Mindest-Handelsvolumen.
   */
  belowMinTrade: boolean
}

export interface GroupResult {
  group: AssetGroup
  /** Außerhalb des Bandes, aber unter dem Mindest-Handelsvolumen. */
  belowMinTrade?: boolean
  actualValue: number
  actualPercent: number
  targetPercent: number
  targetValue: number
  lowerBand: number
  upperBand: number
  suggestion: Suggestion
  deltaEuro: number
}

export interface LiquidityResult {
  /** Geldmarkt + Cash — die tatsächlich verfügbare Liquidität. */
  liquidAssets: number
  /** Betrag, der als Sicherheit unangetastet bleiben soll. */
  securityBuffer: number
  /**
   * Was höchstens investiert werden kann: verfügbare Liquidität abzüglich
   * Sicherheitspuffer. Negativ heißt, der Puffer ist noch nicht erreicht.
   */
  investmentReserve: number
  /** Dieselbe Zahl als Anteil am Gesamtvermögen. */
  investmentReservePercent: number
}

/**
 * Berechnet die Liquiditätskennzahlen.
 *
 * Nur Geldmarkt und Cash zählen als verfügbar — Laufzeit-Anleihen nicht.
 * Sie sind zwar Anleihen, aber weder kurzfristig noch schwankungsarm genug,
 * um als Reserve für einen Nachkauf zu dienen.
 */
export function computeLiquidity(
  portfolio: Portfolio,
  quotes: QuoteMap,
  settings: Settings,
  total: number,
): LiquidityResult {
  const liquidAssets =
    groupMarketValue('moneymarket', portfolio, quotes, settings.currency) +
    groupMarketValue('cash', portfolio, quotes, settings.currency)

  const securityBuffer = resolveAmount(settings.securityBuffer, total)
  const investmentReserve = liquidAssets - securityBuffer

  return {
    liquidAssets,
    securityBuffer,
    investmentReserve,
    investmentReservePercent: actualPercent(investmentReserve, total),
  }
}

export interface RebalancingResult {
  total: number
  rounding: number
  groups: GroupResult[]
  rows: PositionResult[]
  liquidity: LiquidityResult
  /** Summe aller Ziel-Anteile in Prozent — soll 100 ergeben. */
  targetPercentSum: number
  /** Über 100 % verteilt: die Ziele widersprechen sich. */
  targetsExceeded: boolean
  /** Stand des Termins — leer, wenn ohne Kalender gearbeitet wird. */
  schedule: ScheduleState
  computedAt: string
}

export interface ScheduleState {
  /** Spielt der Termin in dieser Einstellung überhaupt eine Rolle? */
  active: boolean
  /** Ist er erreicht? */
  due: boolean
  /** Letzter Ausgleich dieses Depots, ISO-Datum. */
  lastRebalancedAt: string | null
  /** Tage bis zum Termin; negativ, wenn überfällig. `null` ohne bisherigen Ausgleich. */
  daysUntilDue: number | null
}

/** Summe der Ziel-Anteile aller aktiven Positionen. */
export function targetPercentSum(portfolio: Portfolio): number {
  return portfolio.positions
    .filter((position) => position.enabled)
    .reduce((sum, position) => sum + position.targetPercent, 0)
}

// Geldmarkt steht neben Cash: beide zusammen bilden die Investitionsreserve.
const GROUPS: readonly AssetGroup[] = [
  'stocks',
  'bonds',
  'metals',
  'moneymarket',
  'cash',
] as const

/** Ziel-% der Gruppe = Summe der Ziel-% der Sub-Positionen. */
function groupTargetPercent(group: AssetGroup, portfolio: Portfolio): number {
  return portfolio.positions
    .filter((position) => position.enabled && position.group === group)
    .reduce((sum, position) => sum + position.targetPercent, 0)
}

/**
 * Hauptaggregator: liefert für ein Portfolio + Kurse + Settings alle
 * abgeleiteten Werte fürs UI.
 *
 * @param now Gegenwart — nur für den Termin relevant; als Parameter, damit
 *            sich das Kalender-Rebalancing prüfen lässt.
 */
export function computeRebalancing(
  portfolio: Portfolio,
  quotes: QuoteMap,
  settings: Settings,
  now: Date = new Date(),
): RebalancingResult {
  const baseCurrency = settings.currency
  const total = totalValue(portfolio, quotes, settings.totalRounding, baseCurrency)
  const bands = settings.bands
  const minTrade = resolveAmount(settings.minTradeSize, total)
  const trigger = settings.rebalancing.trigger
  const due =
    usesCalendar(trigger) &&
    isDue(portfolio.lastRebalancedAt, settings.rebalancing.intervalMonths, now)

  // Auch deaktivierte Positionen kommen in die Liste: wer eine abschaltet,
  // muss sie wiederfinden können. Ihre Kennzahlen bleiben leer, damit klar
  // ist, dass sie nirgends mitzählen.
  const rows: PositionResult[] = portfolio.positions.map((position) => {
    const quote = quoteFor(position, quotes)
    const mv = marketValue(position, quote)

    if (!position.enabled) {
      return {
        position,
        quote,
        marketValue: mv,
        actualPercent: 0,
        targetValue: 0,
        lowerBand: 0,
        upperBand: 0,
        suggestion: 'ok' as Suggestion,
        unitsDelta: 0,
        relativeDeltaPercent: 0,
        isNearBand: false,
        isActive: false,
        excludedReason: 'disabled',
        belowMinTrade: false,
      }
    }

    if (hasForeignCurrency(quote, baseCurrency)) {
      return {
        position,
        quote,
        marketValue: mv,
        actualPercent: 0,
        targetValue: 0,
        lowerBand: 0,
        upperBand: 0,
        suggestion: 'ok' as Suggestion,
        unitsDelta: 0,
        relativeDeltaPercent: 0,
        isNearBand: false,
        isActive: false,
        excludedReason: 'currency',
        belowMinTrade: false,
      }
    }

    const target = targetValue(position, total)
    const low = lowerBand(target, bands)
    const high = upperBand(target, bands)
    const verdict = applyMinTrade(
      combineSuggestion(suggestion(mv, low, high), trigger, due, mv, target),
      target - mv,
      minTrade,
    )

    return {
      position,
      quote,
      marketValue: mv,
      actualPercent: actualPercent(mv, total),
      targetValue: target,
      lowerBand: low,
      upperBand: high,
      suggestion: verdict.suggestion,
      belowMinTrade: verdict.belowMinTrade,
      unitsDelta: unitsDelta(mv, target, quote),
      relativeDeltaPercent: relativeDeltaPercent(mv, target),
      // Ohne laufendes Band gibt es kein „knapp davor" — nur den Termin.
      isNearBand: usesBands(trigger) && isNearBand(mv, low, high, target),
      isActive: true,
      excludedReason: null,
    }
  })

  const groups: GroupResult[] = GROUPS.map((group) => {
    const actualValue = groupMarketValue(group, portfolio, quotes, baseCurrency)
    const targetPercent = groupTargetPercent(group, portfolio)
    const target = (total * targetPercent) / 100
    const low = lowerBand(target, bands)
    const high = upperBand(target, bands)
    // Dieselbe Regel wie in den Zeilen: Was sich als Order nicht lohnt, gibt
    // auch als Gruppe kein Signal.
    const verdict = applyMinTrade(
      combineSuggestion(suggestion(actualValue, low, high), trigger, due, actualValue, target),
      target - actualValue,
      minTrade,
    )

    return {
      group,
      actualValue,
      actualPercent: actualPercent(actualValue, total),
      targetPercent,
      targetValue: target,
      lowerBand: low,
      upperBand: high,
      suggestion: verdict.suggestion,
      belowMinTrade: verdict.belowMinTrade,
      deltaEuro: target - actualValue,
    }
  })

  const liquidity = computeLiquidity(portfolio, quotes, settings, total)

  const assignedTarget = targetPercentSum(portfolio)

  return {
    total,
    rounding: settings.totalRounding,
    groups,
    rows,
    liquidity,
    targetPercentSum: assignedTarget,
    // Kleine Rundungsreste (0.1 %-Punkte) sind kein Fehler — erst darüber.
    targetsExceeded: assignedTarget > 100.001,
    schedule: {
      active: usesCalendar(trigger),
      due,
      lastRebalancedAt: portfolio.lastRebalancedAt ?? null,
      daysUntilDue: daysUntilDue(
        portfolio.lastRebalancedAt,
        settings.rebalancing.intervalMonths,
        now,
      ),
    },
    computedAt: new Date().toISOString(),
  }
}
