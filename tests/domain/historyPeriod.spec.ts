/**
 * Tests für die Zeitraum-Zuordnung.
 *
 * Sie steht an einer Stelle, wird aber an dreien gebraucht — Tabelle,
 * Einstellungen und Katalog. Diese Tests halten fest, dass die drei Angaben
 * zusammenpassen.
 */

import { describe, expect, it } from 'vitest'
import { HISTORY_PERIODS, HISTORY_PERIOD_INFO } from '@/domain/historyPeriod'
import { de } from '@/i18n/de'
import { en } from '@/i18n/en'

describe('HISTORY_PERIOD_INFO', () => {
  it('kennt jeden angebotenen Zeitraum', () => {
    for (const period of HISTORY_PERIODS) {
      expect(HISTORY_PERIOD_INFO[period]).toBeDefined()
    }
  })

  it('holt für „ein Tag" die Woche und schneidet auf zwei Punkte', () => {
    // Zwischen zwei Schlusskursen gibt es keinen Verlauf, wohl aber eine
    // Veränderung. Ein eigener Abruf dafür wäre Verschwendung.
    expect(HISTORY_PERIOD_INFO.day.apiPeriod).toBe('1w')
    expect(HISTORY_PERIOD_INFO.day.limit).toBe(2)
  })

  it('zeigt bei Woche und Monat alle Punkte', () => {
    expect(HISTORY_PERIOD_INFO.week.limit).toBe(0)
    expect(HISTORY_PERIOD_INFO.month.limit).toBe(0)
  })

  it('hat für jede Beschriftung einen Katalog-Eintrag', () => {
    // Ein fehlender Schlüssel erschiene als „history.short.x" im Spaltenkopf.
    for (const period of HISTORY_PERIODS) {
      const key = HISTORY_PERIOD_INFO[period].shortKey
      expect(de.history.short).toHaveProperty(key)
      expect(en.history.short).toHaveProperty(key)
      expect(de.history.periodNames).toHaveProperty(period)
      expect(en.history.periodNames).toHaveProperty(period)
    }
  })
})
