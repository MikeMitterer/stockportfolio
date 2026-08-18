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

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const SRC = resolve(process.cwd(), 'src')

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

/** Alle Dateien unter `src/`, die Markup oder Stil enthalten. */
function quellDateien(dir: string = SRC): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const pfad = join(dir, entry.name)
    if (entry.isDirectory()) return quellDateien(pfad)
    return /\.(vue|scss|css)$/.test(entry.name) ? [pfad] : []
  })
}

interface Fund {
  datei: string
  wo: 'Markup' | 'Stil'
  name: string
}

/** Statische `class="…"`-Attribute — `:class`-Bindungen bleiben außen vor. */
function ausMarkup(quelle: string, datei: string): Fund[] {
  const template = quelle.split('<template>')[1]?.split('<style')[0] ?? ''
  const funde: Fund[] = []

  for (const treffer of template.matchAll(/(?<!:)\bclass="([^"]+)"/g)) {
    for (const name of (treffer[1] ?? '').split(/\s+/)) {
      if (UTILITY.test(name)) funde.push({ datei, wo: 'Markup', name })
    }
  }
  return funde
}

/**
 * Klassen-Selektoren im Stil. Trifft auch die Regel, deren Markup längst
 * umbenannt wurde — genau der Fall, der hier durchgerutscht ist.
 */
function ausStil(quelle: string, datei: string): Fund[] {
  const stil = datei.endsWith('.vue') ? (quelle.split('<style')[1] ?? '') : quelle
  const ohneKommentare = stil.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  const funde: Fund[] = []

  for (const treffer of ohneKommentare.matchAll(/\.([a-zA-Z][\w!/-]*)/g)) {
    const name = treffer[1] ?? ''
    if (UTILITY.test(name)) funde.push({ datei, wo: 'Stil', name })
  }
  return funde
}

describe('Utility-Klassen', () => {
  it('gibt es nicht mehr — Tailwind ist ausgebaut', () => {
    const alle = quellDateien().flatMap((pfad) => {
      const quelle = readFileSync(pfad, 'utf8')
      const datei = relative(process.cwd(), pfad)
      return [...ausMarkup(quelle, datei), ...ausStil(quelle, datei)]
    })

    const bericht = alle.map((f) => `${f.datei} (${f.wo}): .${f.name}`).join('\n')

    expect(alle, `Utility-Klasse gefunden — wirkungslos, seit Tailwind raus ist:\n${bericht}`).toEqual(
      [],
    )
  })

  it('erkennt sie im Markup — sonst prüft der Wächter nichts', () => {
    const beispiel = '<template>\n  <div class="postable !my-0 flex">x</div>\n</template>'
    const namen = ausMarkup(beispiel, 'beispiel.vue').map((f) => f.name)

    expect(namen).toEqual(['!my-0', 'flex'])
  })

  it('erkennt sie auch im Stil — das war der Fall, der durchrutschte', () => {
    const beispiel = [
      '<style scoped>',
      '/* .flex im Kommentar zählt nicht */',
      '.flex > :not(:first-of-type) :deep(.n-data-table-thead) { display: none; }',
      '.postable { gap: 0; }',
      '</style>',
    ].join('\n')

    expect(ausStil(beispiel, 'beispiel.vue').map((f) => f.name)).toEqual(['flex'])
  })

  it('lässt eigene Klassen in Ruhe, die nur ähnlich heißen', () => {
    const beispiel = '<template>\n  <span class="visually-hidden tabular-nums kpi__value">x</span>\n</template>'

    expect(ausMarkup(beispiel, 'beispiel.vue')).toEqual([])
  })
})
