import { createApp } from 'vue'
import { createPinia } from 'pinia'
import AuthRoot from '@/auth/AuthRoot.vue'
import { router } from '@/router'
import { i18n } from '@/i18n'
import { readStoredLocale } from '@/stores/locale'
import { applyTheme, readStoredTheme } from '@/stores/theme'
import { LOCALES } from '@/stores/locale'
import { setFormatterLocale } from '@/domain/formatters'
/*
 * Reihenfolge ist nicht beliebig: Schriften und Token zuerst, dann der Reset.
 * Der Reset greift auf Token zu, und die Schrift soll stehen, bevor das erste
 * Zeichen gemalt wird.
 */
import '@mmit/ux-foundation/styles/fonts.css'
import '@mmit/ux-foundation/styles/tokens.css'
import '@mmit/ux-foundation/styles/reset.css'
import '@/assets/style.scss'

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

applyTheme(readStoredTheme())

const app = createApp(AuthRoot)

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')
