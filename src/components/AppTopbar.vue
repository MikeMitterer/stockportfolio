<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon } from 'naive-ui'
import { RouterLink, useRoute } from 'vue-router'

defineProps<{
  isDark: boolean
  lastRefreshLabel?: string
}>()

const emit = defineEmits<{
  (event: 'toggle-theme'): void
  (event: 'refresh'): void
}>()

const { t } = useI18n()
const route = useRoute()

const navItems = computed(() => [
  { name: 'dashboard', label: t('nav.dashboard') },
  { name: 'instruments', label: t('nav.instruments') },
  { name: 'settings', label: t('nav.settings') },
])

const isActive = (name: string): boolean => route.name === name
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-800 bg-white/85 dark:bg-neutral-950/85 backdrop-blur"
  >
    <div class="max-w-[1400px] mx-auto flex items-center gap-6 px-6 h-14">
      <RouterLink
        :to="{ name: 'dashboard' }"
        class="flex items-center gap-2 font-semibold text-lg hover:opacity-80"
      >
        <span class="inline-block w-2.5 h-2.5 rounded-full bg-teal-400"></span>
        <span>{{ t('app.title') }}</span>
      </RouterLink>

      <nav class="flex items-center gap-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="px-3 py-1.5 rounded-md text-sm transition-colors"
          :class="
            isActive(item.name)
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          "
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="ml-auto flex items-center gap-3">
        <span
          v-if="lastRefreshLabel"
          class="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums"
        >
          {{ lastRefreshLabel }}
        </span>

        <NButton size="small" secondary @click="emit('refresh')">
          <template #icon>
            <NIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 10a8 8 0 0 0-14-4M4 14a8 8 0 0 0 14 4" />
              </svg>
            </NIcon>
          </template>
          {{ t('actions.refresh') }}
        </NButton>

        <NButton size="small" quaternary circle :title="t('actions.toggleTheme')" @click="emit('toggle-theme')">
          <template #icon>
            <NIcon>
              <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="4" />
                <path stroke-linecap="round" d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            </NIcon>
          </template>
        </NButton>
      </div>
    </div>
  </header>
</template>
