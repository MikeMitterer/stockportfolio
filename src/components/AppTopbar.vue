<script setup lang="ts">
import { computed, h, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon } from 'naive-ui'
import { RouterLink, useRoute } from 'vue-router'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'

defineProps<{
  lastRefreshLabel?: string
}>()

const emit = defineEmits<{
  (event: 'refresh'): void
}>()

const { t } = useI18n()
const route = useRoute()

/** Schlichte Strichsymbole — angelehnt an die Navigation des StockInfo-Backends. */
const ICONS: Record<string, Component> = {
  dashboard: () =>
    h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('rect', { x: 3, y: 12, width: 4, height: 8, rx: 1 }),
      h('rect', { x: 10, y: 7, width: 4, height: 13, rx: 1 }),
      h('rect', { x: 17, y: 4, width: 4, height: 16, rx: 1 }),
    ]),
  instruments: () =>
    h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('circle', { cx: 12, cy: 12, r: 9 }),
      h('path', { d: 'M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z' }),
    ]),
  settings: () =>
    h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M4 6h16M4 12h16M4 18h16', 'stroke-linecap': 'round' }),
      h('circle', { cx: 9, cy: 6, r: 2, fill: 'currentColor' }),
      h('circle', { cx: 15, cy: 12, r: 2, fill: 'currentColor' }),
      h('circle', { cx: 7, cy: 18, r: 2, fill: 'currentColor' }),
    ]),
}

const navItems = computed(() => [
  { name: 'dashboard', label: t('nav.dashboard') },
  { name: 'instruments', label: t('nav.instruments') },
  { name: 'settings', label: t('nav.settings') },
])

const isActive = (name: string): boolean => route.name === name
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-edge bg-page/90 backdrop-blur">
    <div class="max-w-[1400px] mx-auto flex items-center gap-3 md:gap-6 px-4 md:px-6 h-14">
      <!-- Plakette + Wortmarke, wie im Backend-Frontend -->
      <RouterLink :to="{ name: 'dashboard' }" class="flex items-center gap-2.5 hover:opacity-90">
        <span
          class="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
          :style="{
            background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--asset-bonds)))',
          }"
        >
          <svg
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgb(var(--accent-contrast))"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 17l5-6 4 4 6-8" />
            <path d="M15 7h4v4" />
          </svg>
        </span>
        <span class="hidden sm:inline font-semibold text-lg tracking-tight">
          {{ t('app.title') }}
        </span>
      </RouterLink>

      <nav class="flex items-center gap-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors relative"
          :class="
            isActive(item.name)
              ? 'text-ink'
              : 'text-ink-secondary hover:text-ink hover:bg-raised'
          "
        >
          <NIcon :size="15">
            <component :is="ICONS[item.name]" />
          </NIcon>
          <span class="hidden md:inline">{{ item.label }}</span>
          <span class="sr-only md:hidden">{{ item.label }}</span>
          <!-- Aktiver Eintrag: Unterstrich in Akzentfarbe, wie im Backend -->
          <span
            v-if="isActive(item.name)"
            class="absolute left-2 right-2 -bottom-[9px] h-0.5 rounded-full bg-accent"
          ></span>
        </RouterLink>
      </nav>

      <div class="ml-auto flex items-center gap-3">
        <span v-if="lastRefreshLabel" class="hidden sm:inline text-xs text-ink-muted tabular-nums">
          {{ lastRefreshLabel }}
        </span>

        <NButton size="small" secondary @click="emit('refresh')">
          <template #icon>
            <NIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6" />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M20 10a8 8 0 0 0-14-4M4 14a8 8 0 0 0 14 4"
                />
              </svg>
            </NIcon>
          </template>
          <span class="hidden md:inline">{{ t('actions.refresh') }}</span>
        </NButton>

        <ThemeSwitcher />
      </div>
    </div>
  </header>
</template>
