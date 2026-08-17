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

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const SRC = resolve(process.cwd(), 'src')

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

/** Alle Quelldateien unter `src/`, rekursiv. */
function sourceFiles(dir: string = SRC): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(ts|vue)$/.test(entry.name) ? [path] : []
  })
}

describe('Zugriff auf den localStorage', () => {
  it('läuft überall über safeStorage aus dem Fundament', () => {
    const treffer = sourceFiles()
      .filter((path) => DIRECT_ACCESS.test(withoutComments(readFileSync(path, 'utf8'))))
      .map((path) => relative(process.cwd(), path))

    expect(
      treffer,
      `Direkter Speicherzugriff — stattdessen safeStorage aus @mmit/ux-foundation:\n${treffer.join('\n')}`,
    ).toEqual([])
  })

  it('findet überhaupt Dateien — sonst prüft der Wächter nichts', () => {
    // Ohne das wäre ein Tippfehler im Pfad ein stets grüner Test.
    expect(sourceFiles().length).toBeGreaterThan(50)
  })
})
