/**
 * Die Fortschrittsleiste am oberen Rand.
 *
 * Sie beantwortet „passiert gerade etwas?" für Kursabrufe und Depotabgleiche.
 */

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppProgressBar from '@/components/AppProgressBar.vue'

function bar(active: boolean, percent: number | null) {
  return mount(AppProgressBar, { props: { active, percent, label: 'Kurse werden geholt' } })
}

describe('AppProgressBar', () => {
  it('steht gar nicht im Dokument, solange nichts läuft', () => {
    expect(bar(false, 0).find('.progressbar').exists()).toBe(false)
  })

  it('zeigt den Stand als Breite', () => {
    const fill = bar(true, 60).find('.progressbar__fill')

    expect(fill.attributes('style')).toContain('width: 60%')
  })

  /** Ein Balken mit Breite null sieht aus wie keiner — der Start bleibt sichtbar. */
  it('bleibt bei 0 % sichtbar', () => {
    const fill = bar(true, 0).find('.progressbar__fill')

    expect(fill.attributes('style')).toContain('width: 2%')
  })

  it('läuft nicht über 100 % hinaus', () => {
    const fill = bar(true, 140).find('.progressbar__fill')

    expect(fill.attributes('style')).toContain('width: 100%')
  })

  it('nennt Hilfstechnik den Stand', () => {
    const bar60 = bar(true, 60).find('.progressbar')

    expect(bar60.attributes('role')).toBe('progressbar')
    expect(bar60.attributes('aria-valuenow')).toBe('60')
    expect(bar60.attributes('aria-label')).toBe('Kurse werden geholt')
  })

  it('zeigt bei einem Live-Abgleich ohne messbaren Fortschritt keinen erfundenen Prozentwert', () => {
    const liveBar = bar(true, null).find('.progressbar')

    expect(liveBar.classes()).toContain('progressbar--indeterminate')
    expect(liveBar.attributes('aria-valuenow')).toBeUndefined()
    expect(liveBar.attributes('aria-label')).toBe('Kurse werden geholt')
  })
})
