/**
 * Wächter: kein eigenes CSS auf einer Naive-Komponente.
 *
 * Übernommen aus StockInfo, wo eine ganze Reihe von Fehlern dieselbe Ursache
 * hatte: eine `class` an einem `N…`-Element, dazu eine scoped-Regel, die
 * Fläche, Farbe oder Größe setzt. Das addiert sich zu dem, was die Bibliothek
 * ohnehin mitbringt — Knöpfe wurden zu groß, ein rotes ✕ verlor seine Farbe,
 * ein Knopf stand höher als die Auswahl daneben. Hier gab es das Muster nie;
 * der Test hält es so.
 *
 * **Es gibt eine Sorte Knopf.** Wer die Größe ändern will, nimmt `size`; wer
 * die Bedeutung ändern will, `type`. Was bleibt und hier erlaubt ist: wo ein
 * Element sitzt und wie breit es sein darf (`flex`, `width`, `gap`,
 * `align-*`) — Layout ist Sache der Seite, nicht der Komponente.
 */

import { readFileSync } from 'node:fs'
import { relative } from 'node:path'

import { describe, expect, it } from 'vitest'
import { PROJECT_ROOT } from './helpers/projectRoot'
import { filesUnder, SRC } from './helpers/sourceTree'

/** Was eine Komponentenbibliothek selbst mitbringt — hier also tabu. */
const LIBRARY_PROPERTIES = [
  'background',
  'border',
  'border-radius',
  'padding',
  'color',
  'font-size',
  'font-weight',
  'min-height',
  'min-width',
  'height',
  'box-shadow',
  'margin',
]

interface Finding {
  file: string
  className: string
  properties: string[]
}

/** Sucht Klassen, die an einer Naive-Komponente hängen und eigenes CSS tragen. */
function findingsIn(source: string, file: string): Finding[] {
  const template = source.split('<template>')[1]?.split('<style')[0] ?? ''
  const style = source.split('<style')[1] ?? ''

  const classNames = new Set<string>()
  for (const match of template.matchAll(/<N[A-Za-z]+\b[^>]*?\sclass="([^"]+)"/gs)) {
    for (const name of (match[1] ?? '').split(/\s+/)) classNames.add(name)
  }

  const found: Finding[] = []
  for (const className of classNames) {
    const rule = new RegExp(
      `\\.${className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{((?:[^{}]|\\{[^{}]*\\})*)\\}`,
      'g',
    )
    for (const match of style.matchAll(rule)) {
      const block = match[1] ?? ''
      const properties = LIBRARY_PROPERTIES.filter((name) =>
        new RegExp(`(?<![\\w-])${name}\\s*:`).test(block),
      )
      if (properties.length > 0) found.push({ file, className, properties })
    }
  }
  return found
}

describe('Eigenes CSS auf Naive-Komponenten', () => {
  it('gibt es nicht — Größe über `size`, Bedeutung über `type`', () => {
    const all = filesUnder(SRC, ['.vue']).flatMap((filePath) =>
      findingsIn(readFileSync(filePath, 'utf8'), relative(PROJECT_ROOT, filePath)),
    )

    const report = all
      .map((f) => `${f.file} → .${f.className}: ${f.properties.join(', ')}`)
      .join('\n')

    expect(all, `Eigenes CSS auf einer Naive-Komponente:\n${report}`).toEqual([])
  })

  it('findet überhaupt Komponenten — sonst prüft der Wächter nichts', () => {
    const withNaive = filesUnder(SRC, ['.vue']).filter((filePath) =>
      /<N[A-Za-z]+/.test(readFileSync(filePath, 'utf8')),
    )

    expect(withNaive.length).toBeGreaterThan(8)
  })
})
