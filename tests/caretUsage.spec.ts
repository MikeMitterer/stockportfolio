/**
 * Wächter: kein handgezeichneter Pfeil.
 *
 * Jede aufklappbare Fläche zeichnete ihren eigenen (T-16 im Fundament) — hier
 * dreimal, in StockInfo zweimal. Der SVG-Pfad war überall derselbe, abgeschrieben
 * und danach einzeln verstellt: 2 und 2.5 Strichstärke, 0.75 und 0.875 rem
 * Größe, drei Deckkräfte. Genau der Verlauf, den ux-standards beschreibt — die
 * Kopie, die man beim zweiten Mal duldet, ist beim dritten Mal auseinandergelaufen.
 *
 * Geprüft wird statisch wie in `componentStyles.spec.ts`: Ein Mount-Test je
 * Fundstelle sagt nur, dass *diese* Stelle stimmt; ein Scan sagt, dass es keine
 * vierte gibt.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const SRC = resolve(process.cwd(), 'src')

/** Alle `.vue`-Dateien unter `src/`, rekursiv. */
function vueFiles(dir: string = SRC): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return vueFiles(path)
    return entry.name.endsWith('.vue') ? [path] : []
  })
}

/**
 * Ein Pfeil-Pfad, wie ihn alle Fundstellen hatten: zwei Striche, die sich unten
 * treffen. Erkannt an der Form `M<x> <y>l<dx> <dy> <dx> -<dy>` samt Schreibweisen
 * mit Komma oder Leerzeichen — nicht an einem festen String, sonst rutscht die
 * nächste Kopie mit anderer Formatierung durch.
 */
const PFEIL_PFAD = /\bd="M\s*-?[\d.]+[\s,]+-?[\d.]+\s*[lL][\s,]*-?[\d.]+[\s,]+-?[\d.]+/

describe('Pfeil für Aufklappbares', () => {
  it('wird nirgends selbst gezeichnet — UxCaret ist die eine Quelle', () => {
    const funde = vueFiles()
      .map((pfad) => ({ pfad: relative(process.cwd(), pfad), quelle: readFileSync(pfad, 'utf8') }))
      .filter(({ quelle }) => PFEIL_PFAD.test(quelle))
      .map(({ pfad }) => pfad)

    expect(funde, `Handgezeichneter Pfeil statt UxCaret in:\n${funde.join('\n')}`).toEqual([])
  })

  /*
   * Gegenprobe zum Scan oben: Fände er nichts, weil es keine aufklappbaren
   * Flächen mehr gibt, wäre er stillschweigend nutzlos.
   */
  it('kommt in den aufklappbaren Flächen tatsächlich vor', () => {
    const mitCaret = vueFiles().filter((pfad) => /<UxCaret\b/.test(readFileSync(pfad, 'utf8')))

    expect(mitCaret.length).toBeGreaterThanOrEqual(3)
  })
})
