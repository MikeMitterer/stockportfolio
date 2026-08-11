import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import { router } from '@/router'
import { i18n } from '@/i18n'
import { readStoredLocale } from '@/stores/locale'
import { LOCALES } from '@/stores/locale'
import { setFormatterLocale } from '@/domain/formatters'
import { apiBaseUrl, MissingApiUrlError, StockInfoClient, STOCK_INFO_CLIENT } from '@/api/client'
import { translate } from '@/i18n'
import '@/assets/style.css'

/*
 * Sprache setzen, bevor die App das erste Mal zeichnet.
 *
 * Der Store tut dasselbe in `App.vue`, aber erst nach dem ersten Bildaufbau —
 * bis dahin stünde die Vorgabe auf dem Bildschirm. Für einen Sekundenbruchteil
 * die falsche Sprache zu zeigen ist genau die Art Kleinigkeit, die man nicht
 * mehr los wird.
 */
const startLocale = readStoredLocale()
i18n.global.locale.value = startLocale
setFormatterLocale(LOCALES[startLocale].numberLocale)
document.documentElement.lang = startLocale

/*
 * Ohne API-Adresse startet die App nicht.
 *
 * Kein Rückfallwert und auch kein stiller Weiterlauf: Ohne Kurse wäre jede
 * Zahl auf dem Bildschirm falsch. Die Meldung steht statt der App auf der
 * Seite — ein weißes Fenster mit einem Eintrag in der Entwicklerkonsole ist
 * für den, der einen Container startet, keine Auskunft.
 */
let baseUrl: string
try {
  baseUrl = apiBaseUrl()
} catch (cause) {
  if (!(cause instanceof MissingApiUrlError)) throw cause
  showStartupError()
  throw cause
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// API-Client einmalig erzeugen und per DI bereitstellen — Composables
// injizieren ihn, statt ihn selbst zu instanziieren (testbar).
app.provide(STOCK_INFO_CLIENT, new StockInfoClient(baseUrl))

app.mount('#app')

/** Lesbare Meldung anstelle der App — ohne Vue, das läuft hier noch nicht. */
function showStartupError(): void {
  const root = document.querySelector('#app')
  if (!root) return

  const box = document.createElement('div')
  box.setAttribute(
    'style',
    'max-width:38rem;margin:4rem auto;padding:1.5rem;font-family:system-ui,sans-serif;' +
      'line-height:1.6;border:1px solid #a33;border-radius:.5rem',
  )

  const heading = document.createElement('h1')
  heading.style.fontSize = '1.25rem'
  heading.style.margin = '0 0 .75rem'
  heading.textContent = translate('startup.noApiUrlTitle')

  const body = document.createElement('p')
  body.style.margin = '0 0 .75rem'
  body.textContent = translate('startup.noApiUrlBody')

  const hint = document.createElement('pre')
  hint.setAttribute(
    'style',
    'margin:0;padding:.75rem;overflow-x:auto;background:#0002;border-radius:.375rem',
  )
  hint.textContent = 'docker run -e STOCKINFO_API_URL=http://<host>:8000 …'

  const repo = document.createElement('p')
  repo.setAttribute('style', 'margin:.75rem 0 0;font-size:.875rem;opacity:.8')
  repo.textContent = translate('startup.noApiUrlRepo')

  box.append(heading, body, hint, repo)
  root.replaceChildren(box)
}
