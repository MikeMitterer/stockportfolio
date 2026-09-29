/**
 * Tests für die Verlaufslinie.
 *
 * Der Pfad ist eine Zeichenkette — prüfbar ohne Browser. Wichtig sind vor
 * allem die Randfälle: zu wenig Punkte, flacher Verlauf, kaputte Werte. Eine
 * Linie, die eine Aussage vortäuscht, ist schlimmer als keine.
 */

import { describe, expect, it } from 'vitest'
import { buildSparkline, type HistoryPoint } from '@/domain/sparkline'

function points(...closes: number[]): HistoryPoint[] {
  return closes.map((close, index) => ({ date: `2026-01-${String(index + 1).padStart(2, '0')}`, close }))
}

describe('buildSparkline', () => {
  it('zeichnet eine Linie durch alle Punkte', () => {
    const line = buildSparkline(points(10, 20, 30), 100, 50)

    expect(line.path.startsWith('M')).toBe(true)
    expect(line.path.split('L')).toHaveLength(3)
  })

  it('legt den ersten Punkt links und den letzten rechts an den Rand', () => {
    const line = buildSparkline(points(10, 20, 30), 100, 50)

    expect(line.path).toContain('M0,')
    expect(line.path).toContain('100,')
  })

  it('skaliert auf den Wertebereich, nicht auf null', () => {
    // Bei einem Kurs zwischen 160 und 165 wäre eine Achse ab null eine gerade
    // Linie — und damit nutzlos. Der tiefste Wert liegt unten, der höchste oben.
    const line = buildSparkline(points(160, 165), 100, 50)

    expect(line.path).toBe('M0,50 L100,0')
  })

  it('legt einen flachen Verlauf in die Mitte, statt durch null zu teilen', () => {
    const line = buildSparkline(points(100, 100, 100), 100, 50)

    expect(line.path).toBe('M0,25 L50,25 L100,25')
  })

  it('rechnet die Veränderung vom ersten zum letzten Punkt', () => {
    expect(buildSparkline(points(100, 110), 100, 50).changePercent).toBeCloseTo(10, 6)
    expect(buildSparkline(points(100, 90), 100, 50).changePercent).toBeCloseTo(-10, 6)
  })

  it('meldet Hoch und Tief', () => {
    const line = buildSparkline(points(120, 90, 150, 100), 100, 50)

    expect(line.min).toBe(90)
    expect(line.max).toBe(150)
  })

  it('nennt die Richtung — Gleichstand gilt als steigend', () => {
    expect(buildSparkline(points(100, 110), 100, 50).rising).toBe(true)
    expect(buildSparkline(points(110, 100), 100, 50).rising).toBe(false)
    expect(buildSparkline(points(100, 100), 100, 50).rising).toBe(true)
  })

  it('zeichnet bei einem einzigen Punkt nichts', () => {
    // Eine Waagrechte aus einem Punkt täuscht einen Verlauf vor, den es nicht
    // gibt.
    expect(buildSparkline(points(100), 100, 50).path).toBe('')
  })

  it('zeichnet ohne Punkte nichts und wirft nicht', () => {
    const line = buildSparkline([], 100, 50)

    expect(line.path).toBe('')
    expect(line.changePercent).toBe(0)
  })

  it('überspringt kaputte Werte, statt einen NaN-Pfad zu bauen', () => {
    // Ein einziges NaN im Pfad macht das ganze SVG unbrauchbar — der Browser
    // zeichnet dann gar nichts, ohne Fehlermeldung.
    const line = buildSparkline(
      [
        { date: '2026-01-01', close: 10 },
        { date: '2026-01-02', close: Number.NaN },
        { date: '2026-01-03', close: 30 },
      ],
      100,
      50,
    )

    expect(line.path).not.toContain('NaN')
    expect(line.max).toBe(30)
  })

  it('schließt die Fläche unten ab', () => {
    const line = buildSparkline(points(10, 20), 100, 50)

    expect(line.areaPath.startsWith('M0,50')).toBe(true)
    expect(line.areaPath.endsWith('Z')).toBe(true)
  })

  it('rundet die Koordinaten, damit der Pfad kurz bleibt', () => {
    const line = buildSparkline(points(1, 2, 3), 100, 33)

    expect(line.path).not.toMatch(/\.\d{3}/)
  })

  it('bleibt bei einem Nullkurs am Anfang bei 0 %', () => {
    // Sonst käme Unendlich heraus und stünde so in der Zeile.
    expect(buildSparkline(points(0, 50), 100, 50).changePercent).toBe(0)
  })
})
