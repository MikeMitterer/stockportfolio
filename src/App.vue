<script setup lang="ts">
import { computed, inject, ref, watch, onMounted } from 'vue'
import { RouterView } from 'vue-router'
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
import { useRelativeTime } from '@/composables/useRelativeTime'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { useLocaleStore } from '@/stores/locale'
import { useThemeStore } from '@/stores/theme'
import { buildNaiveOverrides, UxAppShell } from '@mmit/ux-foundation'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT)
if (!client) throw new Error('StockInfoClient wurde nicht bereitgestellt')

const portfolioStore = usePortfolioStore()
const quotesStore = useQuotesStore()
const themeStore = useThemeStore()
const localeStore = useLocaleStore()

const lastRefreshAt = computed(() => quotesStore.lastRefreshAt)
const ageLabel = useRelativeTime(lastRefreshAt)
const refreshLabel = computed(() => (quotesStore.loading ? '…' : ageLabel.value))

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

function refresh(): void {
  if (!client) return
  void quotesStore.loadQuotes(client, portfolioStore.positions)
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
            <UxAppShell>
              <template #topbar>
                <AppTopbar :last-refresh-label="refreshLabel" @refresh="refresh" />
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


