/**
 * Kursverlauf als Linie.
 *
 * Rechnet Kurspunkte in einen SVG-Pfad um — mehr braucht eine Verlaufslinie
 * nicht. Bewusst ohne Diagramm-Bibliothek: Die App zeichnet ihre Balken schon
 * selbst, und ein Paket für eine Polylinie wäre mehr Abhängigkeit als Nutzen.
 *
 * Reine Funktionen, kein DOM: Der Pfad ist eine Zeichenkette, die Prüfung
 * braucht keinen Browser.
 */

/** Ein Punkt des Verlaufs — Datum nur zur Beschriftung. */
export interface HistoryPoint {
  date: string
  close: number
}

export interface Sparkline {
  /** `d`-Attribut für ein `<path>`; leer, wenn zu wenig Punkte da sind. */
  path: string
  /** Derselbe Verlauf als geschlossene Fläche unter der Linie. */
  areaPath: string
  min: number
  max: number
  first: number
  last: number
  /** Veränderung vom ersten zum letzten Punkt, in Prozent. */
  changePercent: number
  /** Steht der letzte Wert über dem ersten? Bei Gleichstand `true`. */
  rising: boolean
}

/**
 * Baut die Linie in einem Koordinatensystem von `width` × `height`.
 *
 * Die Skala richtet sich nach dem tatsächlichen Wertebereich, nicht nach null:
 * Bei einem Kurs, der zwischen 160 und 165 schwankt, wäre eine Achse ab null
 * eine gerade Linie und damit nutzlos. Eine Verlaufslinie zeigt die Bewegung,
 * nicht das Niveau — für das Niveau steht der Kurs daneben.
 *
 * @param points Kurspunkte in zeitlicher Reihenfolge.
 * @param width  Breite des Koordinatensystems.
 * @param height Höhe des Koordinatensystems.
 */
export function buildSparkline(points: HistoryPoint[], width: number, height: number): Sparkline {
  const values = points.map((point) => point.close).filter((value) => Number.isFinite(value))

  if (values.length === 0) {
    return { path: '', areaPath: '', min: 0, max: 0, first: 0, last: 0, changePercent: 0, rising: true }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const first = values[0] as number
  const last = values[values.length - 1] as number

  // Ein einzelner Punkt ergibt keine Linie — dann lieber nichts zeichnen als
  // eine Waagrechte, die eine Aussage vortäuscht.
  if (values.length < 2) {
    return {
      path: '',
      areaPath: '',
      min,
      max,
      first,
      last,
      changePercent: 0,
      rising: true,
    }
  }

  // Ein flacher Verlauf hätte sonst Division durch null; er landet mittig.
  const span = max - min
  const stepX = width / (values.length - 1)

  const coords = values.map((value, index) => {
    const x = index * stepX
    const y = span === 0 ? height / 2 : height - ((value - min) / span) * height
    return `${round(x)},${round(y)}`
  })

  const path = `M${coords.join(' L')}`
  const areaPath = `M0,${round(height)} L${coords.join(' L')} L${round(width)},${round(height)} Z`

  return {
    path,
    areaPath,
    min,
    max,
    first,
    last,
    changePercent: first === 0 ? 0 : ((last - first) * 100) / first,
    rising: last >= first,
  }
}

/** Zwei Nachkommastellen genügen im SVG und halten den Pfad kurz. */
function round(value: number): number {
  return Math.round(value * 100) / 100
}
