/**
 * Die Fortschrittsleiste am oberen Rand.
 *
 * Sie beantwortet „passiert gerade etwas?" — der Spinner am Knopf beantwortet
 * „ist mein Klick angekommen?". Deshalb steht sie bei jedem Kursabruf, auch bei
 * dem, den niemand angestoßen hat.
 */

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppProgressBar from '@/components/AppProgressBar.vue'

function leiste(active: boolean, percent: number) {
  return mount(AppProgressBar, { props: { active, percent, label: 'Kurse werden geholt' } })
}

describe('AppProgressBar', () => {
  it('steht gar nicht im Dokument, solange nichts läuft', () => {
    expect(leiste(false, 0).find('.progressbar').exists()).toBe(false)
  })

  it('zeigt den Stand als Breite', () => {
    const füllung = leiste(true, 60).find('.progressbar__fill')

    expect(füllung.attributes('style')).toContain('width: 60%')
  })

  /** Ein Balken mit Breite null sieht aus wie keiner — der Start bleibt sichtbar. */
  it('bleibt bei 0 % sichtbar', () => {
    const füllung = leiste(true, 0).find('.progressbar__fill')

    expect(füllung.attributes('style')).toContain('width: 2%')
  })

  it('läuft nicht über 100 % hinaus', () => {
    const füllung = leiste(true, 140).find('.progressbar__fill')

    expect(füllung.attributes('style')).toContain('width: 100%')
  })

  it('nennt Hilfstechnik den Stand', () => {
    const leiste60 = leiste(true, 60).find('.progressbar')

    expect(leiste60.attributes('role')).toBe('progressbar')
    expect(leiste60.attributes('aria-valuenow')).toBe('60')
    expect(leiste60.attributes('aria-label')).toBe('Kurse werden geholt')
  })
})
