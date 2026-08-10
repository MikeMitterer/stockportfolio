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
  type GlobalThemeOverrides,
} from 'naive-ui'
import AppTopbar from '@/components/AppTopbar.vue'
import { useRelativeTime } from '@/composables/useRelativeTime'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { useThemeStore } from '@/stores/theme'
import { buildNaiveOverrides } from '@/theme/naive'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT)
if (!client) throw new Error('StockInfoClient wurde nicht bereitgestellt')

const portfolioStore = usePortfolioStore()
const quotesStore = useQuotesStore()
const themeStore = useThemeStore()

const lastRefreshAt = computed(() => quotesStore.lastRefreshAt)
const ageLabel = useRelativeTime(lastRefreshAt)
const refreshLabel = computed(() => (quotesStore.loading ? '…' : ageLabel.value))

const naiveOverrides = ref<GlobalThemeOverrides>({})

// Das Theme steht schon vor dem ersten Bildaufbau fest — sonst blitzt kurz
// das falsche auf. Die Naive-Overrides lesen die dann gesetzten Variablen.
themeStore.init()

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
  <NConfigProvider
    :theme="themeStore.isDark ? darkTheme : null"
    :theme-overrides="naiveOverrides"
    inline-theme-disabled
  >
    <NLoadingBarProvider>
      <NMessageProvider>
        <NDialogProvider>
          <NNotificationProvider :max="3">
            <div class="min-h-screen bg-page text-ink transition-colors">
              <AppTopbar :last-refresh-label="refreshLabel" @refresh="refresh" />
              <RouterView />
            </div>
          </NNotificationProvider>
        </NDialogProvider>
      </NMessageProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
