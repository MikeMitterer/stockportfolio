<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, darkTheme } from 'naive-ui'
import { ref } from 'vue'

const isDark = ref<boolean>(true)
</script>

<template>
  <NConfigProvider :theme="isDark ? darkTheme : null">
    <NMessageProvider>
      <NDialogProvider>
        <div class="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
          <div class="max-w-6xl mx-auto p-8">
            <header class="mb-8">
              <h1 class="text-2xl font-semibold">StockPortfolio</h1>
              <p class="text-sm opacity-70 mt-1">
                Tolerance-Band Rebalancing — Grundgerüst steht.
              </p>
            </header>

            <main class="opacity-70 text-sm">
              <p>Als Nächstes: UI-Shell, Router, i18n, API-Client, Domain-Modul.</p>
            </main>
          </div>
        </div>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
