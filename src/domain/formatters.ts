/**
 * Reine Formatter-Funktionen für Zahlen, EUR-Beträge und Prozente.
 * DE-Locale (Punkt als Tausendertrenner, Komma als Dezimaltrenner).
 * Kein DOM, kein Reactivity — unit-testbar.
 */

const EUR = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const EUR_CENT = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const PERCENT = new Intl.NumberFormat('de-DE', {
  style: 'decimal',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const PERCENT_0 = new Intl.NumberFormat('de-DE', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const NUMBER = new Intl.NumberFormat('de-DE', {
  style: 'decimal',
  maximumFractionDigits: 4,
})

const INT = new Intl.NumberFormat('de-DE', {
  style: 'decimal',
  maximumFractionDigits: 0,
})

/** Formatiert Euro-Beträge — Standard ohne Nachkommastellen. */
export function eur(value: number): string {
  return EUR.format(value)
}

/** Formatiert Euro-Beträge mit Cent-Genauigkeit (für Kurse). */
export function eurCent(value: number): string {
  return EUR_CENT.format(value)
}

/** Formatiert eine Prozentzahl mit einer Nachkommastelle und Suffix `%`. */
export function percent(value: number): string {
  return `${PERCENT.format(value)} %`
}

/** Formatiert eine Prozentzahl ohne Nachkommastelle. */
export function percentInt(value: number): string {
  return `${PERCENT_0.format(value)} %`
}

/** Signed-Prozent für Delta-Anzeigen: `+5,3 %` / `−7,8 %`. */
export function percentSigned(value: number): string {
  const sign = value >= 0 ? '+' : '−'
  return `${sign}${PERCENT.format(Math.abs(value))} %`
}

/** Signed-EUR: `+29.000 €` / `−12.000 €`. */
export function eurSigned(value: number): string {
  const sign = value >= 0 ? '+' : '−'
  return `${sign}${EUR.format(Math.abs(value))}`
}

/** Ganzzahl mit Tausendertrenner. */
export function integer(value: number): string {
  return INT.format(value)
}

/** Beliebige Zahl (bis 4 Nachkommastellen) mit DE-Locale. */
export function number(value: number): string {
  return NUMBER.format(value)
}
