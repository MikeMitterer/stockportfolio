<script setup lang="ts">
import { computed, inject, ref, watch, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NLoadingBarProvider,
  darkTheme,
} from 'naive-ui'
import AppTopbar from '@/components/AppTopbar.vue'
import { useRelativeTime } from '@/composables/useRelativeTime'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'

const STORAGE_KEY = 'stockportfolio.theme'
const isDark = ref<boolean>(true)

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT)
if (!client) throw new Error('StockInfoClient wurde nicht bereitgestellt')

const portfolioStore = usePortfolioStore()
const quotesStore = useQuotesStore()

const lastRefreshAt = computed(() => quotesStore.lastRefreshAt)
const ageLabel = useRelativeTime(lastRefreshAt)
const refreshLabel = computed(() => (quotesStore.loading ? '…' : ageLabel.value))

onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    isDark.value = stored === 'dark'
  }
})

watch(
  isDark,
  (dark) => {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', dark)
  },
  { immediate: true },
)

function toggleTheme(): void {
  isDark.value = !isDark.value
}

function refresh(): void {
  if (!client) return
  void quotesStore.loadQuotes(client, portfolioStore.positions)
}
</script>

<template>
  <NConfigProvider :theme="isDark ? darkTheme : null" inline-theme-disabled>
    <NLoadingBarProvider>
      <NMessageProvider>
        <NDialogProvider>
          <div
            class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors"
          >
            <AppTopbar
              :is-dark="isDark"
              :last-refresh-label="refreshLabel"
              @toggle-theme="toggleTheme"
              @refresh="refresh"
            />
            <RouterView />
          </div>
        </NDialogProvider>
      </NMessageProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
