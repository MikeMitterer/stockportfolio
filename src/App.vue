<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { NConfigProvider, NMessageProvider, NDialogProvider, NLoadingBarProvider, darkTheme } from 'naive-ui'
import AppTopbar from '@/components/AppTopbar.vue'

const STORAGE_KEY = 'stockportfolio.theme'
const isDark = ref<boolean>(true)

onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    isDark.value = stored === 'dark'
  }
})

watch(isDark, (dark) => {
  localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', dark)
}, { immediate: true })

function toggleTheme(): void {
  isDark.value = !isDark.value
}

function refresh(): void {
  // Preview: kein Refresh, kommt in T-04 (API-Client) + T-05 (Store)
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
            <AppTopbar :is-dark="isDark" @toggle-theme="toggleTheme" @refresh="refresh" />
            <RouterView />
          </div>
        </NDialogProvider>
      </NMessageProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
