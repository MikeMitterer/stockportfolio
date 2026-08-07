import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import { router } from '@/router'
import { i18n } from '@/i18n'
import { apiBaseUrl, StockInfoClient, STOCK_INFO_CLIENT } from '@/api/client'
import '@/assets/style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// API-Client einmalig erzeugen und per DI bereitstellen — Composables
// injizieren ihn, statt ihn selbst zu instanziieren (testbar).
app.provide(STOCK_INFO_CLIENT, new StockInfoClient(apiBaseUrl()))

app.mount('#app')
