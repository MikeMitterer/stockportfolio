/**
 * Wächter: kein handgezeichneter Pfeil.
 *
 * Jede aufklappbare Fläche zeichnete ihren eigenen (T-16 im Fundament) — hier
 * dreimal, in StockInfo zweimal. Der SVG-Pfad war überall derselbe, abgeschrieben
 * und danach einzeln verstellt: 2 und 2.5 Strichstärke, 0.75 und 0.875 rem
 * Größe, drei Deckkräfte. Genau der Verlauf, den ux-conventions beschreibt — die
 * Kopie, die man beim zweiten Mal duldet, ist beim dritten Mal auseinandergelaufen.
 *
 * Geprüft wird statisch wie in `componentStyles.spec.ts`: Ein Mount-Test je
 * Fundstelle sagt nur, dass *diese* Stelle stimmt; ein Scan sagt, dass es keine
 * vierte gibt.
 */

import { readFileSync } from 'node:fs'
import { relative } from 'node:path'

import { describe, expect, it } from 'vitest'
import { PROJECT_ROOT } from './helpers/projectRoot'
import { filesUnder, SRC } from './helpers/sourceTree'

/**
 * Ein Pfeil-Pfad, wie ihn alle Fundstellen hatten: zwei Striche, die sich unten
 * treffen. Erkannt an der Form `M<x> <y>l<dx> <dy> <dx> -<dy>` samt Schreibweisen
 * mit Komma oder Leerzeichen — nicht an einem festen String, sonst rutscht die
 * nächste Kopie mit anderer Formatierung durch.
 */
const DRAWN_ARROW = /\bd="M\s*-?[\d.]+[\s,]+-?[\d.]+\s*[lL][\s,]*-?[\d.]+[\s,]+-?[\d.]+/

describe('Pfeil für Aufklappbares', () => {
  it('wird nirgends selbst gezeichnet — UxCaret ist die eine Quelle', () => {
    const findings = filesUnder(SRC, ['.vue'])
      .map((filePath) => ({
        filePath: relative(PROJECT_ROOT, filePath),
        source: readFileSync(filePath, 'utf8'),
      }))
      .filter(({ source }) => DRAWN_ARROW.test(source))
      .map(({ filePath }) => filePath)

    expect(findings, `Handgezeichneter Pfeil statt UxCaret in:\n${findings.join('\n')}`).toEqual([])
  })

  /*
   * Gegenprobe zum Scan oben: Fände er nichts, weil es keine aufklappbaren
   * Flächen mehr gibt, wäre er stillschweigend nutzlos.
   */
  it('kommt in den aufklappbaren Flächen tatsächlich vor', () => {
    const withCaret = filesUnder(SRC, ['.vue']).filter((filePath) =>
      /<UxCaret\b/.test(readFileSync(filePath, 'utf8')),
    )

    expect(withCaret.length).toBeGreaterThanOrEqual(3)
  })
})
