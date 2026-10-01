import { describe, expect, it } from 'vitest'
import { de } from '@/i18n/de'
import { en } from '@/i18n/en'

/**
 * Login, Hinweis unter den Tabellen, About und Methodenseite beschreiben
 * dieselbe Sache und müssen stimmig bleiben (Mike, 2026-10-01). Statt eines
 * Ausschlusses („keine Anlageberatung“) beschreiben sie, was die App tut.
 */
describe('Hinweise zu Kauf- und Verkaufswerten', () => {
  it.each([
    ['de', de, 'Die App prüft nicht, ob ein Geschäft oder ein Finanzinstrument für dich geeignet ist, und führt keine Orders aus.', 'Prüfe Daten, Kurse, Kosten und Risiken, bevor du handelst.', /Anlageberatung|Empfehlung zum Handeln|Orientierungshilfe/],
    ['en', en, 'The app does not check whether a trade or a financial instrument suits you, and it does not place orders.', 'Check data, prices, costs and risks before you trade.', /investment advice|recommendations? to trade|guides/],
  ] as const)('sind in „%s“ stimmig', (_locale, catalog, limit, check, oldDisclaimer) => {
    // Der Login-Hinweis hebt Kernaussagen mit `**…**` hervor; verglichen wird der Text.
    const plain = (text: string) => text.replace(/\*\*/g, '')
    const login = plain(catalog.auth.investmentNotice)
    const notices = [login, catalog.tradeNotice, catalog.about.use]
    expect(catalog.tradeNotice + catalog.about.use).not.toContain('**')
    for (const notice of notices) {
      expect(notice).toContain(limit)
      expect(notice).toContain(check)
      expect(notice).not.toMatch(oldDisclaimer)
    }
    expect(catalog.method.limitsAdvice).not.toMatch(oldDisclaimer)
    // Login und About nennen die Symbole mit demselben Satz.
    const status = catalog.about.use.split('. ')[0]!
    expect(status).toMatch(/↓.*↑/)
    expect(login).toContain(status)
    // Der Login-Hinweis ist zur besseren Lesbarkeit in drei Absätze gegliedert.
    expect(login.split('\n\n')).toHaveLength(3)
  })
})
