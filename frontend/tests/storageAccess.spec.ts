/**
 * Wächter: kein direkter Griff in den localStorage.
 *
 * Der Anlass steht im Dashboard. Dort las ein `localStorage.getItem` in
 * `onMounted` einen eingeklappten Block aus — ungeschützt. Im privaten Modus
 * mancher Browser wirft schon der Zugriff, und weil die Zeile vor dem Laden
 * des Depots stand, blieb die ganze Ansicht leer. Wegen eines eingeklappten
 * Blocks.
 *
 * Drei andere Stellen hatten ihr eigenes `try` — dieselben vier Zeilen,
 * viermal geschrieben, einmal vergessen. Genau so entsteht der Fehler. Seit
 * `safeStorage` im Fundament liegt, gibt es keinen Grund mehr für den
 * direkten Weg, und dieser Test hält das fest: Er prüft nicht die drei
 * bekannten Stellen, sondern jede künftige.
 */

import { readFileSync } from 'node:fs'
import { relative } from 'node:path'

import { describe, expect, it } from 'vitest'
import { PROJECT_ROOT } from './helpers/projectRoot'
import { filesUnder, SRC } from './helpers/sourceTree'

/** Ein Aufruf am Speicher — nicht bloß das Wort im Fließtext eines Kommentars. */
const DIRECT_ACCESS = /localStorage\s*\??\.\s*(getItem|setItem|removeItem|clear|key)/

/**
 * Wirft Kommentarzeilen weg.
 *
 * Ohne das schlägt der Wächter an, sobald ein Kommentar erklärt, was hier
 * gerade **nicht** mehr steht — genau der Fall im Dashboard. Code beginnt
 * nie mit `//`, `*` oder `/*`, deshalb reicht der Zeilenanfang.
 */
function withoutComments(source: string): string {
  return source
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\/\*|\*)/.test(line))
    .join('\n')
}

describe('Zugriff auf den localStorage', () => {
  it('läuft überall über safeStorage aus dem Fundament', () => {
    const matches = filesUnder(SRC, ['.ts', '.vue'])
      .filter((path) => DIRECT_ACCESS.test(withoutComments(readFileSync(path, 'utf8'))))
      .map((path) => relative(PROJECT_ROOT, path))

    expect(
      matches,
      `Direkter Speicherzugriff — stattdessen safeStorage aus @mmit/ux-foundation:\n${matches.join('\n')}`,
    ).toEqual([])
  })

  it('findet überhaupt Dateien — sonst prüft der Wächter nichts', () => {
    // Ohne das wäre ein Tippfehler im Pfad ein stets grüner Test.
    expect(filesUnder(SRC, ['.ts', '.vue']).length).toBeGreaterThan(50)
  })
})
