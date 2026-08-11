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

/**
 * Anzahl mit passender Form: „1 Position", „3 Positionen".
 *
 * Zusammengeschrieben, weil beides zusammengehört — die Zahl bestimmt die
 * Form. Getrennt stand in jeder Ansicht dasselbe `count === 1 ? … : …`, und
 * eine dieser Stellen war irgendwann anders.
 *
 * @param count    Anzahl.
 * @param singular Form für genau eins.
 * @param plural   Form für alles andere; ohne Angabe `singular` + „en".
 */
export function counted(count: number, singular: string, plural?: string): string {
  return `${INT.format(count)} ${count === 1 ? singular : (plural ?? `${singular}en`)}`
}

/**
 * Nur die Form, ohne Zahl — für Sätze, in denen die Zahl woanders steht.
 *
 * @param count    Anzahl.
 * @param singular Form für genau eins.
 * @param plural   Form für alles andere; ohne Angabe `singular` + „en".
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}en`)
}

/**
 * Formatter je Währung, einmal gebaut und gemerkt.
 *
 * `Intl.NumberFormat` zu erzeugen ist teuer genug, dass es sich in einer
 * Tabellenzelle bemerkbar macht.
 */
const byCurrency = new Map<string, Intl.NumberFormat>()

/**
 * Betrag in einer beliebigen Währung, ohne Nachkommastellen.
 *
 * Gebraucht für Positionen, die nicht in der Basiswährung notieren: Ihr
 * Marktwert ist in ihrer eigenen Währung richtig und darf nicht mit dem
 * falschen Zeichen danebenstehen — „31.410 €" für einen USD-Betrag ist
 * schlimmer als gar keine Angabe.
 *
 * @param value    Betrag.
 * @param currency ISO-Code, z.B. `USD`.
 */
export function money(value: number, currency: string): string {
  const code = currency.toUpperCase()
  let formatter = byCurrency.get(code)
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 0,
      })
    } catch {
      // Unbekannter Code — dann lieber die nackte Zahl mit angehängtem Kürzel
      // als eine Ausnahme mitten in der Tabelle.
      return `${INT.format(value)} ${code}`
    }
    byCurrency.set(code, formatter)
  }
  return formatter.format(value)
}

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
