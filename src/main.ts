import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import { router } from '@/router'
import { i18n } from '@/i18n'
import { readStoredLocale } from '@/stores/locale'
import { LOCALES } from '@/stores/locale'
import { setFormatterLocale } from '@/domain/formatters'
import { apiBaseUrl, StockInfoClient, STOCK_INFO_CLIENT } from '@/api/client'
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

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// API-Client einmalig erzeugen und per DI bereitstellen — Composables
// injizieren ihn, statt ihn selbst zu instanziieren (testbar).
app.provide(STOCK_INFO_CLIENT, new StockInfoClient(apiBaseUrl()))

app.mount('#app')
