/**
 * Reine Formatter-Funktionen für Zahlen, Beträge und Prozente.
 *
 * Die Sprache steht als Modulzustand, nicht als Parameter an jeder Funktion:
 * Diese Formatter werden hundertfach in Tabellenzellen aufgerufen, und ein
 * zusätzliches Argument an jeder Stelle wäre Lärm, den niemand liest. Wer die
 * Sprache umstellt, ruft `setFormatterLocale` — der Locale-Store tut das.
 *
 * Kein DOM, kein Reactivity — unit-testbar.
 */

/** Aktive Sprache für alle Formatter. */
let locale = 'de-DE'

/**
 * Stellt Sprache und Zahlenformat um.
 *
 * Alle vorbereiteten Formatter werden verworfen; sie entstehen beim nächsten
 * Aufruf neu. Sie stehen zu lassen wäre der klassische Fehler — die Zahlen
 * blieben deutsch formatiert, während die Beschriftung schon englisch ist.
 *
 * @param next BCP-47-Kennung, z.B. `en-GB`.
 */
export function setFormatterLocale(next: string): void {
  if (next === locale) return
  locale = next
  cache.clear()
  byCurrency.clear()
}

/** Aktive Sprache — für alles, was selbst formatiert (Datumsangaben). */
export function formatterLocale(): string {
  return locale
}

/**
 * Formatter je Bauart, einmal gebaut und gemerkt.
 *
 * `Intl.NumberFormat` zu erzeugen ist teuer genug, dass es sich in einer
 * Tabellenzelle bemerkbar macht.
 */
const cache = new Map<string, Intl.NumberFormat>()

function formatter(name: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}::${name}`
  let existing = cache.get(key)
  if (!existing) {
    existing = new Intl.NumberFormat(locale, options)
    cache.set(key, existing)
  }
  return existing
}

const EUR = (): Intl.NumberFormat =>
  formatter('eur', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const EUR_CENT = (): Intl.NumberFormat =>
  formatter('eurCent', {
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
  return `${INT().format(count)} ${count === 1 ? singular : (plural ?? `${singular}en`)}`
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

/** Formatter je Währung — getrennt, weil der Code von außen kommt. */
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
  let currencyFormatter = byCurrency.get(code)
  if (!currencyFormatter) {
    try {
      currencyFormatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 0,
      })
    } catch {
      // Unbekannter Code — dann lieber die nackte Zahl mit angehängtem Kürzel
      // als eine Ausnahme mitten in der Tabelle.
      return `${INT().format(value)} ${code}`
    }
    byCurrency.set(code, currencyFormatter)
  }
  return currencyFormatter.format(value)
}

const PERCENT = (): Intl.NumberFormat =>
  formatter('percent', {
  style: 'decimal',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  })

const PERCENT_0 = (): Intl.NumberFormat =>
  formatter('percent_0', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  })

const NUMBER = (): Intl.NumberFormat =>
  formatter('number', {
  style: 'decimal',
  maximumFractionDigits: 4,
  })

const INT = (): Intl.NumberFormat =>
  formatter('int', {
  style: 'decimal',
  maximumFractionDigits: 0,
  })

/** Formatiert Euro-Beträge — Standard ohne Nachkommastellen. */
export function eur(value: number): string {
  return EUR().format(value)
}

/** Formatiert Euro-Beträge mit Cent-Genauigkeit (für Kurse). */
export function eurCent(value: number): string {
  return EUR_CENT().format(value)
}

/** Formatiert eine Prozentzahl mit einer Nachkommastelle und Suffix `%`. */
export function percent(value: number): string {
  return `${PERCENT().format(value)} %`
}

/** Formatiert eine Prozentzahl ohne Nachkommastelle. */
export function percentInt(value: number): string {
  return `${PERCENT_0().format(value)} %`
}

/** Signed-Prozent für Delta-Anzeigen: `+5,3 %` / `−7,8 %`. */
export function percentSigned(value: number): string {
  const sign = value >= 0 ? '+' : '−'
  return `${sign}${PERCENT().format(Math.abs(value))} %`
}

/** Signed-EUR: `+29.000 €` / `−12.000 €`. */
export function eurSigned(value: number): string {
  const sign = value >= 0 ? '+' : '−'
  return `${sign}${EUR().format(Math.abs(value))}`
}

/** Ganzzahl mit Tausendertrenner. */
export function integer(value: number): string {
  return INT().format(value)
}

/** Beliebige Zahl (bis 4 Nachkommastellen) mit DE-Locale. */
export function number(value: number): string {
  return NUMBER().format(value)
}
