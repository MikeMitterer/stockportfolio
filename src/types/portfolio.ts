/**
 * Domain-Typen für Portfolio-, Positions- und Settings-Daten.
 * Referenz: docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md §5.
 */

/**
 * Assetklassen.
 *
 * `moneymarket` steht für geldmarktnahe Papiere (z.B. Ultrashort-Bond-ETFs).
 * Sie zählen zusammen mit Cash zur verfügbaren Liquidität und damit zur
 * Investitionsreserve — Laufzeit-Anleihen (`bonds`) tun das nicht.
 */
export type AssetGroup = 'stocks' | 'bonds' | 'metals' | 'moneymarket' | 'cash'

export type Suggestion = 'buy' | 'sell' | 'ok'

/**
 * Gattung des Papiers.
 *
 * Entscheidet, welche externen Verweise gelten: ein Meldefonds-Nachweis
 * ergibt nur bei Fonds Sinn — eine Aktie kann keiner sein. Auch Profilseiten
 * wie extraETF trennen ihre Adressen danach.
 */
export type InstrumentKind = 'etf' | 'stock'

export interface Position {
  id: string
  isin: string | null
  symbol: string
  displayName: string
  group: AssetGroup
  /** Gattung laut API; `null` bei Cash oder solange unbekannt. */
  kind: InstrumentKind | null
  units: number
  targetPercent: number
  enabled: boolean
  notes?: string
}

export interface Portfolio {
  id: string
  name: string
  positions: Position[]
  createdAt: string
  updatedAt: string
  /**
   * Tag des letzten Ausgleichs, ISO-Datum — `null`/fehlend heißt: noch nie.
   *
   * Steht am Depot, nicht in den Einstellungen: Wann zuletzt ausgeglichen
   * wurde, ist eine Tatsache dieses Depots. Bei mehreren Depots wäre ein
   * gemeinsames Datum schlicht falsch.
   */
  lastRebalancedAt?: string | null
}

export interface Bands {
  lowerPercent: number
  upperPercent: number
}

/**
 * Was einen Ausgleich auslöst.
 *
 * - `bands`    — laufend, sobald ein Anteil sein Band verlässt.
 * - `calendar` — nur zum Termin, dann aber alles, was abweicht.
 * - `both`     — Bänder laufend, der Termin nimmt zusätzlich die kleineren
 *                Abweichungen mit.
 *
 * Reines Kalender-Rebalancing ist die schwächere Variante: Ein Einbruch im
 * März wartet bis Dezember. `both` ist deshalb die empfohlene Kombination.
 */
export type RebalancingTrigger = 'bands' | 'calendar' | 'both'

export interface RebalancingSchedule {
  trigger: RebalancingTrigger
  /** Abstand zwischen zwei Terminen in Monaten; 12 = jährlich. */
  intervalMonths: number
}

/**
 * Verweis auf eine externe Seite zu einem Papier.
 *
 * Konfigurierbar, weil solche Quellen weder allgemeingültig noch stabil sind:
 * der Meldefonds-Nachweis der ÖKB gilt nur für Österreich, und Anbieter
 * ändern ihre Adressen. Statt das im Code festzuschreiben, pflegt der Nutzer
 * seine eigenen Verweise.
 *
 * Im `urlTemplate` werden `{isin}` und `{symbol}` ersetzt.
 */
export interface ExternalLink {
  id: string
  label: string
  urlTemplate: string
  /** Für welche Gattungen der Verweis gilt — leer heißt „für alle". */
  appliesTo: InstrumentKind[]
  enabled: boolean
}

/**
 * Ein Betrag, der wahlweise absolut oder als Anteil am Depot gilt.
 *
 * Beide Lesarten sind berechtigt und hängen davon ab, was jemand meint: Ein
 * Notgroschen von „drei Monatsausgaben" wächst nicht mit dem Depot, ein
 * Liquiditätsanteil schon. Dieselbe Wahl stellt sich beim
 * Mindest-Handelsvolumen — deshalb eine gemeinsame Form statt zweier
 * gleichaussehender Typen.
 */
export interface AmountSetting {
  /** `percent` = Anteil am Gesamtvermögen, `absolute` = fester Betrag in Euro. */
  mode: 'percent' | 'absolute'
  value: number
}

export interface Settings {
  activePortfolioId: string
  totalRounding: number
  bands: Bands
  securityBuffer: AmountSetting
  /**
   * Betrag, unter dem sich ein Trade nicht lohnt.
   *
   * Relative Bänder machen kleine Positionen empfindlich — genau das ist ihr
   * Zweck. In Euro gerechnet heißt es aber, dass ein Ziel von 2 % bei einem
   * Band von 6 % schon bei 120 € ein Signal gibt; dafür lohnt keine Order.
   * Wer diese Grenze setzt, bekommt für solche Fälle kein Signal mehr — die
   * Abweichung bleibt sichtbar, der Handlungsbedarf entfällt.
   *
   * `0` schaltet die Prüfung ab.
   */
  minTradeSize: AmountSetting
  /** Auslöser und Terminabstand des Ausgleichs. */
  rebalancing: RebalancingSchedule
  currency: 'EUR'
  refresh: { autoOnLoad: boolean; staleAfterMinutes: number }
  links: ExternalLink[]
  ui: {
    /**
     * Sekunden, nach denen sich eine Meldung von selbst ausblendet.
     *
     * `0` heißt: stehen lassen, bis die Ursache behoben ist oder der Nutzer
     * wegklickt. Unabhängig davon verschwindet jede Meldung sofort, sobald ihr
     * Grund entfällt — der Zähler beendet nur das Warten darauf.
     */
    notificationSeconds: number
    /**
     * Zeitraum der Verlaufslinie in der Tabelle.
     *
     * `day` ist ein Sonderfall: Zwischen zwei Schlusskursen gibt es keinen
     * Verlauf, wohl aber eine Veränderung — Gewinn oder Verlust vom letzten
     * Handelstag auf heute.
     */
    historyPeriod: HistoryPeriod
  }
}

/** Zeitraum der Verlaufslinie in der Positionstabelle. */
export type HistoryPeriod = 'day' | 'week' | 'month'

export interface QuoteCacheEntry {
  isin: string | null
  symbol: string
  price: number
  currency: string
  /** Gattung laut API (`etf` | `stock`) — Rückfall für Positionen ohne `kind`. */
  type: string | null
  volatility: number | null
  name: string | null
  ter: number | null
  accumulating: boolean | null
  fetchedAt: string
  cached: boolean
  stale: boolean
}

export type QuoteMap = Map<string, QuoteCacheEntry>
