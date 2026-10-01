import { createLocale, deDE, enUS } from 'naive-ui'

/**
 * Naive-Sprachpakete der App, ohne Standard-Platzhalter.
 *
 * Naive füllt Felder ohne eigenen Platzhalter mit „Please Input“ bzw. „Bitte
 * ausfüllen“. Unter einer Beschriftung wie „Username“ sagt das nichts Neues
 * und wirkt unfertig (T-71). Ein ausdrücklich gesetzter Platzhalter geht vor.
 * Datums- und Zeitauswahl behalten ihren Hinweis, weil er das Format erklärt.
 */
const withoutPlaceholders = {
  Input: { placeholder: '' },
  InputNumber: { placeholder: '' },
  Select: { placeholder: '' },
}

export const naiveLocales = {
  de: createLocale(withoutPlaceholders, deDE),
  en: createLocale(withoutPlaceholders, enUS),
}
