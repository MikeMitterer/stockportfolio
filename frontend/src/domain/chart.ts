/**
 * Rechenteile für das Kursdiagramm — Achsenteilung, Skalen, Punktsuche.
 *
 * Reine Funktionen, kein DOM. Das Zeichnen selbst macht die Komponente; hier
 * steht nur, *wo* etwas hingehört.
 */

import type { HistoryPoint } from './sparkline'

/**
 * Rundet eine Schrittweite auf einen ablesbaren Wert.
 *
 * Erlaubt sind 1, 2, 2,5, 5 und 10 mal einer Zehnerpotenz — dieselben
 * Sprünge, die auch auf einem Lineal stehen. Alles andere zwingt zum Rechnen.
 *
 * @param raw Rechnerische Schrittweite.
 */
function niceStep(raw: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const normalized = raw / magnitude

  if (normalized > 5) return 10 * magnitude
  if (normalized > 2.5) return 5 * magnitude
  if (normalized > 2) return 2.5 * magnitude
  if (normalized > 1) return 2 * magnitude
  return magnitude
}

/**
 * Teilt einen Wertebereich in runde Schritte.
 *
 * „Rund" heißt: 1, 2, 2,5 oder 5 mal einer Zehnerpotenz. Eine Achse mit
 * 163,4172 als Beschriftung ist zwar genau, aber niemand liest sie — die
 * Achse dient dem Überschlag, den genauen Wert zeigt der Zeiger.
 *
 * Die Grenzen werden nach außen auf den nächsten Schritt gerundet, damit die
 * Linie nicht am Rand klebt.
 *
 * @param min         Kleinster vorkommender Wert.
 * @param max         Größter vorkommender Wert.
 * @param targetCount Ungefähre Anzahl der Striche.
 */
export function niceTicks(min: number, max: number, targetCount = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return []

  // Ein flacher Verlauf hat keine Spanne — dann ein künstliches Fenster
  // aufziehen, sonst gäbe es weder Schritt noch Achse.
  if (min === max) {
    const pad = Math.abs(min) > 0 ? Math.abs(min) * 0.01 : 1
    min -= pad
    max += pad
  }

  const step = niceStep((max - min) / Math.max(1, targetCount))
  const first = Math.floor(min / step) * step
  const last = Math.ceil(max / step) * step

  const ticks: number[] = []
  // Über die Anzahl laufen statt aufzuaddieren: Wiederholtes Addieren von
  // 0,1 sammelt Rundungsfehler, die man den Beschriftungen ansieht.
  const count = Math.round((last - first) / step)
  for (let index = 0; index <= count; index += 1) {
    ticks.push(Number((first + index * step).toPrecision(12)))
  }
  return ticks
}

/**
 * Wählt Positionen für die Zeitachse aus.
 *
 * Gibt Indizes zurück, keine Daten: Welches Format lesbar ist, hängt vom
 * Zeitraum ab und gehört in die Anzeige. Der erste und der letzte Punkt sind
 * immer dabei — sie spannen den gezeigten Bereich auf.
 *
 * @param length Anzahl der Punkte.
 * @param count  Gewünschte Anzahl Striche (mindestens 2).
 */
export function tickIndices(length: number, count = 5): number[] {
  if (length <= 0) return []
  if (length <= count) return Array.from({ length }, (_, index) => index)

  const steps = Math.max(1, count - 1)
  const indices = new Set<number>()
  for (let index = 0; index <= steps; index += 1) {
    indices.add(Math.round((index * (length - 1)) / steps))
  }
  return [...indices].sort((a, b) => a - b)
}

/**
 * Punkt unter dem Mauszeiger.
 *
 * @param ratio  Waagrechte Position im Diagramm, 0 bis 1.
 * @param length Anzahl der Punkte.
 * @returns Index des nächstgelegenen Punktes; `-1` ohne Punkte.
 */
export function indexAtRatio(ratio: number, length: number): number {
  if (length <= 0) return -1
  if (length === 1) return 0
  const clamped = Math.max(0, Math.min(1, ratio))
  return Math.round(clamped * (length - 1))
}

/**
 * Veränderung gegenüber dem ersten Punkt, in Prozent.
 *
 * Die rechte Achse zeigt dieselben Linien wie die linke, nur anders
 * beschriftet: Ein Kurs ist ein Wert, seine Veränderung eine Ableitung davon —
 * zwei Achsen für dieselben Daten, nicht zwei Datenreihen.
 *
 * @param value Wert an der Stelle.
 * @param first Erster Wert des Zeitraums.
 */
export function changeFrom(value: number, first: number): number {
  if (first === 0) return 0
  return ((value - first) * 100) / first
}

/** Kleinster und größter Schlusskurs; `null` ohne brauchbare Punkte. */
export function extent(points: HistoryPoint[]): { min: number; max: number } | null {
  const values = points.map((point) => point.close).filter((value) => Number.isFinite(value))
  if (values.length === 0) return null
  return { min: Math.min(...values), max: Math.max(...values) }
}
