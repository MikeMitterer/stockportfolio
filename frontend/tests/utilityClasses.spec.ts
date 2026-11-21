/**
 * Wächter: keine Utility-Klassen im Markup, keine Utility-Selektoren im Stil.
 *
 * Tailwind ist aus dieser App ausgebaut. Zwei Leichen haben das lange
 * überlebt, beide unsichtbar:
 *
 * - `<NDivider class="!my-0" />` — die Klasse tat nichts mehr, also stand der
 *   Standardabstand von Naive da: 49 px Leerfläche um einen 1 px-Strich.
 * - `.flex > :not(:first-of-type) … { display: none }` — der Wrapper hieß
 *   längst `.postable`, damit griff die Regel nicht mehr und **jede**
 *   Assetklasse trug ihre eigene Spaltenkopfzeile statt nur der ersten.
 *
 * Das ist die tückische Sorte Fehler: Eine tote Utility-Klasse wirft nichts,
 * sie lässt die Regel bloß still ausfallen. Der Test sucht deshalb nach dem
 * Muster, nicht nach den zwei bekannten Fundstellen.
 *
 * Was hier **nicht** getroffen wird: eigene Klassen, die zufällig so heißen
 * (`visually-hidden`, `tabular-nums`), und `:class`-Bindungen mit Vue-Logik.
 */

import { readFileSync } from 'node:fs'
import { relative } from 'node:path'

import { describe, expect, it } from 'vitest'
import { PROJECT_ROOT } from './helpers/projectRoot'
import { filesUnder, SRC } from './helpers/sourceTree'

/**
 * Tailwind-Muster: Kürzel mit Skalenwert (`mt-4`, `w-1/2`, `text-sm`),
 * Layout-Wörter, die es dort einzeln gibt (`flex`, `grid`, `truncate`), und
 * die `!`-Variante für „wichtig".
 */
const UTILITY = new RegExp(
  '^!?(' +
    // Abstände, Größen, Typografie, Farben — Kürzel plus Wert
    '[mp][trblxy]?-(?:px|auto|\\d|\\[)|' +
    '(?:w|h|min-w|min-h|max-w|max-h)-(?:full|screen|auto|px|\\d|\\[)|' +
    'gap(?:-[xy])?-\\d|space-[xy]-\\d|' +
    'text-(?:xs|sm|base|lg|xl|\\dxl|left|right|center|white|black)|' +
    'font-(?:thin|light|normal|medium|semibold|bold|black|sans|serif|mono)|' +
    'bg-(?:white|black|transparent|gray|slate|red|green|blue)|' +
    'border-(?:\\d|t|b|l|r|x|y)|rounded(?:-(?:sm|md|lg|xl|full))?|' +
    'shadow(?:-(?:sm|md|lg|xl))?|opacity-\\d|z-\\d|' +
    // alleinstehende Layout-Wörter
    'flex|grid|block|inline-block|hidden|truncate|' +
    'items-(?:start|center|end|baseline|stretch)|' +
    'justify-(?:start|center|end|between|around|evenly)|' +
    'overflow-(?:auto|hidden|scroll|visible)|' +
    'absolute|relative|fixed|sticky' +
    ')$',
)

interface Finding {
  file: string
  where: 'Markup' | 'Stil'
  name: string
}

/** Statische `class="…"`-Attribute — `:class`-Bindungen bleiben außen vor. */
function fromMarkup(source: string, file: string): Finding[] {
  // `slice(1)`: Eine SFC darf mehrere `<template>`-Blöcke haben — heute tut es
  // keine, aber `[1]` würde ab dem zweiten still nur den ersten prüfen.
  const template = source.split('<template>').slice(1).join('\n').split('<style')[0] ?? ''
  const findings: Finding[] = []

  for (const match of template.matchAll(/(?<!:)\bclass="([^"]+)"/g)) {
    for (const name of (match[1] ?? '').split(/\s+/)) {
      if (UTILITY.test(name)) findings.push({ file, where: 'Markup', name })
    }
  }
  return findings
}

/**
 * Klassen-Selektoren im Stil. Trifft auch die Regel, deren Markup längst
 * umbenannt wurde — genau der Fall, der hier durchgerutscht ist.
 */
function fromStyle(source: string, file: string): Finding[] {
  // Alle Stil-Blöcke, nicht nur den ersten: `PositionsTable.vue` und
  // `SettingsView.vue` haben je zwei. Mit `[1]` lag der zweite außerhalb der
  // Prüfung — genau dort hätte ein toter Utility-Selektor unbemerkt überlebt.
  const style = file.endsWith('.vue') ? source.split('<style').slice(1).join('\n') : source
  const withoutComments = style.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  const findings: Finding[] = []

  for (const match of withoutComments.matchAll(/\.([a-zA-Z][\w!/-]*)/g)) {
    const name = match[1] ?? ''
    if (UTILITY.test(name)) findings.push({ file, where: 'Stil', name })
  }
  return findings
}

describe('Utility-Klassen', () => {
  it('gibt es nicht mehr — Tailwind ist ausgebaut', () => {
    const all = filesUnder(SRC, ['.vue', '.scss', '.css']).flatMap((filePath) => {
      const source = readFileSync(filePath, 'utf8')
      const file = relative(PROJECT_ROOT, filePath)
      return [...fromMarkup(source, file), ...fromStyle(source, file)]
    })

    const report = all.map((f) => `${f.file} (${f.where}): .${f.name}`).join('\n')

    expect(
      all,
      `Utility-Klasse gefunden — wirkungslos, seit Tailwind raus ist:\n${report}`,
    ).toEqual([])
  })

  it('erkennt sie im Markup — sonst prüft der Wächter nichts', () => {
    const example = '<template>\n  <div class="postable !my-0 flex">x</div>\n</template>'
    const names = fromMarkup(example, 'beispiel.vue').map((f) => f.name)

    expect(names).toEqual(['!my-0', 'flex'])
  })

  it('erkennt sie auch im Stil — das war der Fall, der durchrutschte', () => {
    const example = [
      '<style scoped>',
      '/* .flex im Kommentar zählt nicht */',
      '.flex > :not(:first-of-type) :deep(.n-data-table-thead) { display: none; }',
      '.postable { gap: 0; }',
      '</style>',
    ].join('\n')

    expect(fromStyle(example, 'beispiel.vue').map((f) => f.name)).toEqual(['flex'])
  })

  it('lässt eigene Klassen in Ruhe, die nur ähnlich heißen', () => {
    const example =
      '<template>\n  <span class="visually-hidden tabular-nums kpi__value">x</span>\n</template>'

    expect(fromMarkup(example, 'beispiel.vue')).toEqual([])
  })
})
