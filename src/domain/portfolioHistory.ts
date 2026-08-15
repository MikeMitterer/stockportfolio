/**
 * Wertverlauf des Depots — zwei Quellen, ein Diagramm.
 *
 * **Rückblick** rechnet den heutigen Bestand gegen alte Kurse. Das ist keine
 * Wertentwicklung des Depots: Ein Papier, das gestern gekauft wurde, erscheint
 * darin über den ganzen Zeitraum. Die App hat keine Historie der Stückzahlen,
 * mehr ist rückwirkend nicht zu holen — deshalb heißt es in der Oberfläche
 * „Rückblick" und nicht „Entwicklung".
 *
 * **Schnappschüsse** sind die Wahrheit, aber erst ab dem Tag, an dem die App
 * angefangen hat, sie zu schreiben. Sie enthalten Käufe und Verkäufe, weil sie
 * den tatsächlichen Gesamtwert festhalten.
 *
 * Reine Funktionen, kein DOM, kein Reactivity.
 */

import type { HistoryPoint } from './sparkline'

/** Ein Tagesstand des Depots, wie er gespeichert wird. */
export interface ValueSnapshot {
  /** ISO-Datum, `YYYY-MM-DD` — ein Eintrag je Tag. */
  date: string
  /** Gesamtwert in der Basiswährung. */
  total: number
}

/** Bestand einer Position mit ihrem Kursverlauf. */
export interface BacktestInput {
  /** Stückzahl heute. */
  units: number
  /**
   * Tagesschlusskurse, aufsteigend nach Datum.
   *
   * Leer für Cash: Solche Positionen haben keinen Kurs und gehen mit ihrem
   * heutigen Wert als konstant ein.
   */
  points: HistoryPoint[]
  /** Marktwert heute — für Positionen ohne Kursverlauf. */
  constantValue?: number
}

/** Letzter Kurs am oder vor einem Datum; `null`, wenn es keinen gibt. */
function closeOnOrBefore(points: HistoryPoint[], date: string): number | null {
  let found: number | null = null
  for (const point of points) {
    if (point.date > date) break
    found = point.close
  }
  return found
}

/**
 * Rechnet den heutigen Bestand gegen die Kurshistorie zurück.
 *
 * Die Zeitachse ist die Vereinigung aller vorkommenden Handelstage, beginnend
 * dort, wo **jedes** Papier mit Kurs schon notiert war. Früher anzufangen hieße,
 * fehlende Kurse als Null zu behandeln — die Kurve fiele dann in eine Stufe, die
 * es nie gab.
 *
 * Innerhalb der Achse wird der letzte bekannte Kurs fortgeschrieben. Börsen
 * haben unterschiedliche Feiertage; ohne das entstünden Zacken, die nur an
 * einem fehlenden Datum liegen.
 *
 * @param inputs Positionen mit Bestand und Kursverlauf.
 * @returns Punkte mit `close` = Gesamtwert; leer, wenn nichts zu rechnen ist.
 */
export function buildBacktest(inputs: BacktestInput[]): HistoryPoint[] {
  const priced = inputs.filter((input) => input.points.length > 0)
  if (priced.length === 0) return []

  // Beginn: der späteste Erstkurs — vorher fehlt mindestens ein Papier.
  const start = priced
    .map((input) => input.points[0]!.date)
    .reduce((latest, date) => (date > latest ? date : latest))

  const dates = [
    ...new Set(
      priced.flatMap((input) =>
        input.points.map((point) => point.date).filter((date) => date >= start),
      ),
    ),
  ].sort()

  const constant = inputs
    .filter((input) => input.points.length === 0)
    .reduce((sum, input) => sum + (input.constantValue ?? 0), 0)

  return dates.map((date) => ({
    date,
    close:
      constant +
      priced.reduce((sum, input) => sum + input.units * (closeOnOrBefore(input.points, date) ?? 0), 0),
  }))
}

/** Schnappschüsse als Punkte für dasselbe Diagramm. */
export function snapshotPoints(snapshots: ValueSnapshot[]): HistoryPoint[] {
  return [...snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((snapshot) => ({ date: snapshot.date, close: snapshot.total }))
}

/**
 * Beschneidet Punkte auf die letzten `days` Tage.
 *
 * @param points Punkte, aufsteigend nach Datum.
 * @param days   Anzahl Tage; `0` oder weniger lässt alles stehen.
 * @param today  Bezugstag.
 */
export function withinDays(points: HistoryPoint[], days: number, today: Date): HistoryPoint[] {
  if (days <= 0) return points

  const limit = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days)
  const iso = `${limit.getFullYear()}-${String(limit.getMonth() + 1).padStart(2, '0')}-${String(
    limit.getDate(),
  ).padStart(2, '0')}`

  return points.filter((point) => point.date >= iso)
}

/**
 * Ab wann die Schnappschüsse den Rückblick ablösen.
 *
 * Das Diagramm zeigt beide Linien; ab diesem Tag ist die Angabe echt, davor
 * gerechnet. Ohne diese Marke sähe die Kurve durchgehend gleich verlässlich
 * aus, und genau das ist sie nicht.
 *
 * @returns ISO-Datum des ersten Schnappschusses, oder `null`.
 */
export function truthStart(snapshots: ValueSnapshot[]): string | null {
  if (snapshots.length === 0) return null
  return snapshots.reduce((first, snapshot) => (snapshot.date < first.date ? snapshot : first)).date
}
