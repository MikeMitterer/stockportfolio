/**
 * vue-i18n-Instanz.
 *
 * Die Sprache setzt der Locale-Store — hier steht nur die Vorgabe, damit die
 * Instanz auch außerhalb einer laufenden App (Tests) benutzbar bleibt.
 */

import { createI18n } from 'vue-i18n'
import { de, type MessageSchema } from './de'
import { en } from './en'

export type AppLocale = 'de' | 'en'

export const i18n = createI18n<[MessageSchema], AppLocale, false>({
  legacy: false,
  locale: 'en',
  // Fehlt eine Übersetzung, erscheint der englische Text — nicht der
  // Schlüssel. Ein „settings.apiHeading" mitten in der Oberfläche ist das
  // Schlimmste, was passieren kann; Text in einer anderen Sprache ist
  // immerhin lesbar.
  fallbackLocale: 'en',
  messages: { de, en },
})

/** Übersetzt außerhalb von Komponenten (Composables) über die globale Instanz. */
export function translate(key: string, named?: Record<string, unknown>): string {
  return i18n.global.t(key, named ?? {})
}
