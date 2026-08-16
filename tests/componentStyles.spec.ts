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

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const SRC = resolve(process.cwd(), 'src')

/** Was eine Komponentenbibliothek selbst mitbringt — hier also tabu. */
const IHRE_SACHE = [
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

/** Alle `.vue`-Dateien unter `src/`, rekursiv. */
function vueFiles(dir: string = SRC): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return vueFiles(path)
    return entry.name.endsWith('.vue') ? [path] : []
  })
}

interface Fund {
  datei: string
  klasse: string
  eigenschaften: string[]
}

/** Sucht Klassen, die an einer Naive-Komponente hängen und eigenes CSS tragen. */
function funde(quelle: string, datei: string): Fund[] {
  const template = quelle.split('<template>')[1]?.split('<style')[0] ?? ''
  const style = quelle.split('<style')[1] ?? ''

  const klassen = new Set<string>()
  for (const treffer of template.matchAll(/<N[A-Za-z]+\b[^>]*?\sclass="([^"]+)"/gs)) {
    for (const name of treffer[1].split(/\s+/)) klassen.add(name)
  }

  const gefunden: Fund[] = []
  for (const klasse of klassen) {
    const regel = new RegExp(`\\.${klasse.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{((?:[^{}]|\\{[^{}]*\\})*)\\}`, 'g')
    for (const treffer of style.matchAll(regel)) {
      const eigenschaften = IHRE_SACHE.filter((name) =>
        new RegExp(`(?<![\\w-])${name}\\s*:`).test(treffer[1]),
      )
      if (eigenschaften.length > 0) gefunden.push({ datei, klasse, eigenschaften })
    }
  }
  return gefunden
}

describe('Eigenes CSS auf Naive-Komponenten', () => {
  it('gibt es nicht — Größe über `size`, Bedeutung über `type`', () => {
    const alle = vueFiles().flatMap((pfad) =>
      funde(readFileSync(pfad, 'utf8'), relative(process.cwd(), pfad)),
    )

    const bericht = alle
      .map((f) => `${f.datei} → .${f.klasse}: ${f.eigenschaften.join(', ')}`)
      .join('\n')

    expect(alle, `Eigenes CSS auf einer Naive-Komponente:\n${bericht}`).toEqual([])
  })

  it('findet überhaupt Komponenten — sonst prüft der Wächter nichts', () => {
    const mitNaive = vueFiles().filter((pfad) => /<N[A-Za-z]+/.test(readFileSync(pfad, 'utf8')))

    expect(mitNaive.length).toBeGreaterThan(8)
  })
})
