import { createI18n } from 'vue-i18n'
import { de, type MessageSchema } from './de'

/** Locale-Erkennung: fürs MVP hart auf 'de'. */
function detectLocale(): 'de' {
  return 'de'
}

export const i18n = createI18n<[MessageSchema], 'de'>({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'de',
  messages: { de },
})

/** Übersetzt außerhalb von Komponenten (Composables) über die globale Instanz. */
export function translate(key: string, named?: Record<string, unknown>): string {
  return i18n.global.t(key, named ?? {})
}
