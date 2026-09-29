/**
 * Tests für die Message-Kataloge.
 *
 * Der Typecheck erzwingt bereits, dass keine Schlüssel fehlen. Was er nicht
 * sieht: leere Werte, vergessene Platzhalter und Pluralformen, die in einer
 * Sprache stehen und in der anderen nicht. Genau daran merkt man eine
 * Übersetzung erst im Betrieb.
 */

import { describe, expect, it } from 'vitest'
import { de } from '@/i18n/de'
import { en } from '@/i18n/en'

type Flat = Record<string, string>

/** Zieht den verschachtelten Katalog auf `a.b.c` flach. */
function flatten(value: unknown, prefix = ''): Flat {
  const out: Flat = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof entry === 'string') out[path] = entry
    else Object.assign(out, flatten(entry, path))
  }
  return out
}

const flatDe = flatten(de)
const flatEn = flatten(en)

/** Platzhalter `{name}` eines Textes. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1] as string).sort()
}

describe('Kataloge', () => {
  it('haben dieselben Schlüssel', () => {
    expect(Object.keys(flatEn).sort()).toEqual(Object.keys(flatDe).sort())
  })

  it('haben nirgends einen leeren Text', () => {
    const empty = Object.entries({ ...flatDe, ...flatEn })
      .filter(([, text]) => text.trim() === '')
      .map(([key]) => key)

    expect(empty).toEqual([])
  })

  it('verwenden je Schlüssel dieselben Platzhalter', () => {
    // Ein vergessenes {amount} in der Übersetzung heißt: Der Betrag fehlt,
    // und der Satz liest sich trotzdem plausibel.
    const mismatched = Object.keys(flatDe).filter(
      (key) =>
        placeholders(flatDe[key] as string).join() !== placeholders(flatEn[key] as string).join(),
    )

    expect(mismatched).toEqual([])
  })

  it('haben bei Pluralformen in beiden Sprachen gleich viele Zweige', () => {
    // vue-i18n wählt nach Position; eine Sprache mit einem Zweig weniger
    // liefert stillschweigend den falschen.
    const mismatched = Object.keys(flatDe).filter(
      (key) =>
        (flatDe[key] as string).split('|').length !== (flatEn[key] as string).split('|').length,
    )

    expect(mismatched).toEqual([])
  })

  it('lassen keinen deutschen Text im englischen Katalog stehen', () => {
    // Grob, aber wirksam: Umlaute kommen im Englischen nicht vor. Fängt
    // Blöcke, die beim Übersetzen stehen geblieben sind.
    const germanish = Object.entries(flatEn)
      .filter(([, text]) => /[äöüßÄÖÜ]/.test(text))
      .map(([key]) => key)

    expect(germanish).toEqual([])
  })
})
