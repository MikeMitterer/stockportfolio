<script setup lang="ts">
import { computed, inject, ref, watch, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NLoadingBarProvider,
  NAlert,
  NButton,
  darkTheme,
  dateDeDE,
  dateEnUS,
  type GlobalThemeOverrides,
} from 'naive-ui'
import AppStatusBar from '@/components/AppStatusBar.vue'
import { naiveLocales } from '@/i18n/naiveLocale'
import AppTopbar from '@/components/AppTopbar.vue'
import AppProgressBar from '@/components/AppProgressBar.vue'
import AppApiAlert from '@/components/AppApiAlert.vue'
import { useRelativeTime } from '@/composables/useRelativeTime'
import { useMinimumDuration } from '@/composables/useMinimumDuration'
import { useApiStatusStore } from '@/stores/apiStatus'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { useQuotesStore } from '@/stores/quotes'
import { useLiveSyncStore } from '@/stores/liveSync'
import { useLocaleStore } from '@/stores/locale'
import { useThemeStore } from '@/stores/theme'
import { buildNaiveOverrides, UxAppShell, UxNotificationProvider } from '@mmit/ux-foundation'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/stockinfo/client'
import { DATA_ERROR_EVENT, DATA_RECOVERED_EVENT, PrivateDataError } from '@/api/data/client'

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT)
if (!client) throw new Error('StockInfoClient wurde nicht bereitgestellt')

// Die Leiste kennt die App nicht — ihre Beschriftung kommt fertig übersetzt herein.
const { t } = useI18n()

const portfolioStore = usePortfolioStore()
const settingsStore = useSettingsStore()
const route = useRoute()
const quotesStore = useQuotesStore()
const liveSync = useLiveSyncStore()
const apiStatus = useApiStatusStore()
const themeStore = useThemeStore()
const localeStore = useLocaleStore()
const dataFailure = ref<PrivateDataError | null>(null)

function onDataFailure(event: Event): void {
  dataFailure.value = (event as CustomEvent<PrivateDataError>).detail
}

function onDataRecovered(): void {
  if (dataFailure.value?.status === 0 || (dataFailure.value?.status ?? 0) >= 500) {
    dataFailure.value = null
  }
}

window.addEventListener(DATA_ERROR_EVENT, onDataFailure)
window.addEventListener(DATA_RECOVERED_EVENT, onDataRecovered)
onUnmounted(() => {
  window.removeEventListener(DATA_ERROR_EVENT, onDataFailure)
  window.removeEventListener(DATA_RECOVERED_EVENT, onDataRecovered)
})

const dataFailureMessage = computed(() => {
  if (dataFailure.value?.status === 409) return t('privateData.conflict')
  if (dataFailure.value?.status === 0 || dataFailure.value?.status === 401 || (dataFailure.value?.status ?? 0) >= 500) {
    return t('privateData.unavailable')
  }
  return t('privateData.rejected')
})

function reloadServerData(): void {
  window.location.reload()
}

// Typänderungen auch nach Aktualisierung außerhalb des Dashboards speichern.
watch(() => [quotesStore.quotes, portfolioStore.portfolio?.id], () => {
  void portfolioStore.syncKinds(quotesStore.quotes)
}, { immediate: true })

const lastRefreshAt = computed(() => quotesStore.lastRefreshAt)
const ageLabel = useRelativeTime(lastRefreshAt)

/*
 * Der Balken oben zeigt Kursabrufe und länger dauernde Depotabgleiche.
 * Die Mindestdauer verhindert, dass er bei schnellen Abrufen nur aufblitzt.
 * Der Knopf bleibt während eines eigenen Kursabrufs gesperrt.
 */
const progressVisible = useMinimumDuration(computed(() =>
  (route.name === 'dashboard' && (!portfolioStore.loaded || !settingsStore.loaded)) || quotesStore.busy || liveSync.syncing,
))
const refreshing = useMinimumDuration(computed(() => quotesStore.forcing))

/*
 * Am Ende läuft die Leiste voll, statt zurückzuschnappen.
 *
 * Ist der letzte Kurs da, stellt der Store seine Zähler auf null — die Leiste
 * steht wegen der Mindestdauer aber noch einen Moment. Ohne diese Zeile fiele
 * sie in diesem Moment von 80 % auf den Anfang zurück und verschwände dann.
 */
const progressPercent = computed(() => (
  quotesStore.busy ? quotesStore.progressPercent : liveSync.syncing ? null : 100
))

// Die Altersangabe hängt am tatsächlichen Laden, nicht am Klick: Sie sagt, dass
// die Zahl daneben gerade nicht stimmt — und das gilt in beiden Fällen.
const refreshLabel = computed(() => (quotesStore.busy ? '…' : ageLabel.value))

const naiveOverrides = ref<GlobalThemeOverrides>({})

/*
 * Naive UI mitziehen: Seine eingebauten Beschriftungen — „Bestätigen",
 * „Abbrechen" in jeder Rückfrage — kämen sonst deutsch heraus, während die
 * Oberfläche englisch ist.
 */
const naiveLocale = computed(() => naiveLocales[localeStore.current])
const naiveDateLocale = computed(() => (localeStore.current === 'en' ? dateEnUS : dateDeDE))

// Das Theme steht schon vor dem ersten Bildaufbau fest — sonst blitzt kurz
// das falsche auf. Die Naive-Overrides lesen die dann gesetzten Variablen.
themeStore.init()
localeStore.init()

onMounted(() => {
  naiveOverrides.value = buildNaiveOverrides()

  /*
   * Einmal beim Start gegen den Dienst klopfen.
   *
   * Vorher tat das die Statuszeile, und das Ergebnis blieb im Ampelpunkt unten
   * rechts stecken: Wer eine falsche Adresse konfiguriert hatte, merkte es erst
   * auf der Papiere-Seite — der einzigen Ansicht, die den Fehler ausspricht.
   * Die Kurse fallen still auf den Cache zurück und schweigen.
   */
  if (client && apiStatus.state === 'unknown') void apiStatus.check(client)

})

/*
 * Die Meldung dazu steht in `AppApiAlert` — sie braucht den
 * NotificationProvider über sich, und der wird hier erst im Template
 * aufgespannt. Ein `useNotifier()` an dieser Stelle findet ihn nicht und reißt
 * beim Start die ganze Oberfläche mit.
 */

watch(
  () => themeStore.current,
  () => {
    // Erst im nächsten Bild lesen: `data-theme` muss am Element stehen,
    // bevor `getComputedStyle` die neuen Werte liefert.
    requestAnimationFrame(() => {
      naiveOverrides.value = buildNaiveOverrides()
    })
  },
)

/**
 * Der ausdrückliche Klick auf „Aktualisieren".
 *
 * Mit `force`, und das ist der Unterschied zum automatischen Laden: Der Dienst
 * antwortet sonst sechs Stunden lang aus seinem eigenen Speicher. Beim
 * Seitenaufruf ist das richtig und schont beide Seiten — wer aber selbst auf
 * einen Knopf drückt, erwartet, dass etwas passiert, und nicht dieselbe Zahl.
 */
async function refresh(): Promise<void> {
  if (!client) return

  /*
   * Erst nachsehen, ob überhaupt jemand da ist.
   *
   * Gegen einen toten Dienst zu laden kostet je Position eine
   * Zeitüberschreitung und meldet hinterher „Kurse fehlen" — für eine Ursache,
   * die der rote Punkt längst zeigt. Anders als beim automatischen Laden wird
   * hier **neu** geprüft: Wer drückt, will wissen, ob es wieder geht.
   */
  if (apiStatus.state === 'offline') {
    await apiStatus.check(client)
    if (apiStatus.state === 'offline') return
  }

  const previousRefreshAt = quotesStore.lastRefreshAt
  await quotesStore.loadQuotes(client, portfolioStore.positions, { force: true })
  if (quotesStore.lastRefreshAt !== previousRefreshAt) await liveSync.announceQuoteRefresh()
}
</script>

<template>
  <!--
    Deutsche Locale für Naive UI: Die eingebauten Beschriftungen — etwa
    „Confirm" / „Cancel" in jeder Rückfrage — kamen sonst englisch heraus,
    mitten in einer sonst deutschen Oberfläche.
  -->
  <NConfigProvider
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
    :theme="themeStore.isDark ? darkTheme : null"
    :theme-overrides="naiveOverrides"
    inline-theme-disabled
  >
    <NLoadingBarProvider>
      <NMessageProvider>
        <NDialogProvider>
          <!--
            Der Anker aus dem Fundament, nicht Naives eigener: Der setzt
            Meldungen zwölf Pixel unter den oberen Rand — also über die
            klebende Kopfzeile, wo sie zu zwei Dritteln dahinter verschwinden.
            `UxNotificationProvider` legt den Versatz auf `--toast-top`.
          -->
          <UxNotificationProvider :max="3">
            <!-- Zeichnet nichts; meldet nur, wenn der Dienst schweigt. -->
            <AppApiAlert />
            <!--
              Spaltenlayout, Grundfläche und die Frage, warum `position:
              sticky` allein die Statuszeile nicht unten hält, stehen im
              Fundament.
            -->
            <!--
              Außerhalb der Shell: Die Leiste klebt am Fensterrand, nicht am
              Inhalt — sonst läge sie unter der Kopfzeile.
            -->
            <AppProgressBar
              :active="progressVisible"
              :percent="progressPercent"
              :label="t(liveSync.syncing && !quotesStore.busy ? 'status.syncLoading' : 'status.quotesLoading')"
            />

            <UxAppShell>
              <template #topbar>
                <AppTopbar
                  :last-refresh-label="refreshLabel"
                  :refreshing="refreshing"
                  @refresh="refresh"
                />
              </template>

              <div v-if="dataFailure" class="private-data-alert">
                <NAlert type="error" :title="t('privateData.title')">
                  <div class="private-data-alert__content">
                    <p>{{ dataFailureMessage }}</p>
                    <NButton type="primary" @click="reloadServerData">{{ t('privateData.reload') }}</NButton>
                  </div>
                </NAlert>
              </div>
              <RouterView v-else />

              <template #statusbar>
                <AppStatusBar v-if="!dataFailure" />
              </template>
            </UxAppShell>
          </UxNotificationProvider>
        </NDialogProvider>
      </NMessageProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>

<style scoped lang="scss">
.private-data-alert { padding: var(--space-6); }
.private-data-alert__content { @include stack(var(--space-4)); }
</style>
