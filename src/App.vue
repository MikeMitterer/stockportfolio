<script setup lang="ts">
import { computed, inject, ref, watch, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NConfigProvider,
  NMessageProvider,
  NNotificationProvider,
  NDialogProvider,
  NLoadingBarProvider,
  darkTheme,
  dateDeDE,
  dateEnUS,
  deDE,
  enUS,
  type GlobalThemeOverrides,
} from 'naive-ui'
import AppStatusBar from '@/components/AppStatusBar.vue'
import AppTopbar from '@/components/AppTopbar.vue'
import AppProgressBar from '@/components/AppProgressBar.vue'
import { useRelativeTime } from '@/composables/useRelativeTime'
import { useMinimumDuration } from '@/composables/useMinimumDuration'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { useLocaleStore } from '@/stores/locale'
import { useThemeStore } from '@/stores/theme'
import { buildNaiveOverrides, UxAppShell } from '@mmit/ux-foundation'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT)
if (!client) throw new Error('StockInfoClient wurde nicht bereitgestellt')

// Die Leiste kennt die App nicht — ihre Beschriftung kommt fertig übersetzt herein.
const { t } = useI18n()

const portfolioStore = usePortfolioStore()
const quotesStore = useQuotesStore()
const themeStore = useThemeStore()
const localeStore = useLocaleStore()

const lastRefreshAt = computed(() => quotesStore.lastRefreshAt)
const ageLabel = useRelativeTime(lastRefreshAt)

/*
 * Zwei Anzeigen, zwei verschiedene Fragen.
 *
 * Der Balken oben sagt „im Hintergrund passiert etwas" und hängt deshalb an
 * jedem Kursabruf. Der Spinner am Knopf sagt „dein Klick ist angekommen" und
 * hängt allein am erzwungenen Abruf — sonst drehte er beim Seitenaufruf mit,
 * ohne dass ihn jemand gedrückt hat, und wäre dabei gesperrt.
 *
 * Beide mit Mindestdauer: Ohne sie blitzen sie bei einem Abruf, der aus dem
 * Speicher des Dienstes kommt, unbemerkt auf.
 */
const progressVisible = useMinimumDuration(computed(() => quotesStore.busy))
const refreshing = useMinimumDuration(computed(() => quotesStore.forcing))

/*
 * Am Ende läuft die Leiste voll, statt zurückzuschnappen.
 *
 * Ist der letzte Kurs da, stellt der Store seine Zähler auf null — die Leiste
 * steht wegen der Mindestdauer aber noch einen Moment. Ohne diese Zeile fiele
 * sie in diesem Moment von 80 % auf den Anfang zurück und verschwände dann.
 */
const progressPercent = computed(() => (quotesStore.busy ? quotesStore.progressPercent : 100))

// Die Altersangabe hängt am tatsächlichen Laden, nicht am Klick: Sie sagt, dass
// die Zahl daneben gerade nicht stimmt — und das gilt in beiden Fällen.
const refreshLabel = computed(() => (progressVisible.value ? '…' : ageLabel.value))

const naiveOverrides = ref<GlobalThemeOverrides>({})

/*
 * Naive UI mitziehen: Seine eingebauten Beschriftungen — „Bestätigen",
 * „Abbrechen" in jeder Rückfrage — kämen sonst deutsch heraus, während die
 * Oberfläche englisch ist.
 */
const naiveLocale = computed(() => (localeStore.current === 'en' ? enUS : deDE))
const naiveDateLocale = computed(() => (localeStore.current === 'en' ? dateEnUS : dateDeDE))

// Das Theme steht schon vor dem ersten Bildaufbau fest — sonst blitzt kurz
// das falsche auf. Die Naive-Overrides lesen die dann gesetzten Variablen.
themeStore.init()
localeStore.init()

onMounted(() => {
  naiveOverrides.value = buildNaiveOverrides()
})

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
function refresh(): void {
  if (!client) return
  void quotesStore.loadQuotes(client, portfolioStore.positions, { force: true })
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
          <NNotificationProvider :max="3">
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
              :label="t('status.quotesLoading')"
            />

            <UxAppShell>
              <template #topbar>
                <AppTopbar
                  :last-refresh-label="refreshLabel"
                  :refreshing="refreshing"
                  @refresh="refresh"
                />
              </template>

              <RouterView />

              <template #statusbar>
                <AppStatusBar />
              </template>
            </UxAppShell>
          </NNotificationProvider>
        </NDialogProvider>
      </NMessageProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>


