/**
 * Wächter: Jede verwendete CSS-Variable ist irgendwo definiert.
 *
 * Eine unbekannte Variable wirft nichts. Der Browser verwirft die ganze
 * Deklaration still, und der Abstand oder die Farbe fehlt einfach. So stand
 * `var(--space-5)` an drei Stellen, obwohl das Fundament nur 1, 2, 3, 4, 6
 * und 8 kennt (T-64).
 *
 * Definiert gilt, was im Fundament oder in `src/` als `--name:` gesetzt oder
 * als `'--name'` aus einer Style-Bindung kommt.
 */

import { readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'
import { PROJECT_ROOT } from './helpers/projectRoot'
import { filesUnder, SRC } from './helpers/sourceTree'

const FOUNDATION = resolve(PROJECT_ROOT, 'frontend/node_modules/@mmit/ux-foundation/src')

function definedNames(files: string[]): Set<string> {
  const names = new Set<string>()
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(/(--[\w-]+)\s*:/g)) names.add(match[1]!)
    for (const match of text.matchAll(/['"](--[\w-]+)['"]/g)) names.add(match[1]!)
  }
  return names
}

describe('CSS-Variablen', () => {
  const defined = definedNames([
    ...filesUnder(FOUNDATION, ['.vue', '.scss', '.css', '.ts']),
    ...filesUnder(SRC, ['.vue', '.scss', '.css', '.ts']),
  ])

  it('findet überhaupt Definitionen — sonst prüft der Wächter nichts', () => {
    expect(defined.has('--space-4')).toBe(true)
  })

  it('verwendet nur Variablen, die definiert sind', () => {
    const unknown = filesUnder(SRC, ['.vue', '.scss', '.css', '.ts']).flatMap((file) => {
      const text = readFileSync(file, 'utf8')
      return [...text.matchAll(/var\(\s*(--[\w-]+)/g)]
        .map((match) => match[1]!)
        .filter((name) => !defined.has(name))
        .map((name) => `${relative(SRC, file)}: ${name}`)
    })
    expect(unknown).toEqual([])
  })
})
