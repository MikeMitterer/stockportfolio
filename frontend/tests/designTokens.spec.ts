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

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const SRC = resolve(process.cwd(), 'frontend/src')
const FOUNDATION = resolve(process.cwd(), 'frontend/node_modules/@mmit/ux-foundation/src')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(vue|scss|css|ts)$/.test(entry.name) ? [path] : []
  })
}

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
  const defined = definedNames([...sourceFiles(FOUNDATION), ...sourceFiles(SRC)])

  it('findet überhaupt Definitionen — sonst prüft der Wächter nichts', () => {
    expect(defined.has('--space-4')).toBe(true)
  })

  it('verwendet nur Variablen, die definiert sind', () => {
    const unknown = sourceFiles(SRC).flatMap((file) => {
      const text = readFileSync(file, 'utf8')
      return [...text.matchAll(/var\(\s*(--[\w-]+)/g)]
        .map((match) => match[1]!)
        .filter((name) => !defined.has(name))
        .map((name) => `${relative(SRC, file)}: ${name}`)
    })
    expect(unknown).toEqual([])
  })
})
