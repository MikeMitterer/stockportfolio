<script setup lang="ts">
import { computed } from 'vue'
import { NDropdown, NButton, NIcon } from 'naive-ui'
import { useThemeStore } from '@/stores/theme'
import { THEME_IDS, THEMES, type ThemeId } from '@/theme/themes'

const themeStore = useThemeStore()

const options = computed(() =>
  THEME_IDS.map((id) => ({
    key: id,
    label: THEMES[id].label,
    // Farbtupfer je Eintrag, damit die Wahl nicht blind erfolgt
    icon: () => renderSwatch(id),
  })),
)

/** Kleiner Farbtupfer aus den Flächen des jeweiligen Themes. */
function renderSwatch(id: ThemeId) {
  return h('span', {
    class: 'inline-block w-3 h-3 rounded-full border',
    style: {
      backgroundColor: SWATCH[id].fill,
      borderColor: SWATCH[id].edge,
    },
  })
}

/**
 * Vorschaufarben je Theme.
 *
 * Bewusst fest notiert und nicht aus den Variablen gelesen: die Tokens des
 * *nicht aktiven* Themes stehen im Dokument nicht zur Verfügung.
 */
const SWATCH: Record<ThemeId, { fill: string; edge: string }> = {
  classic: { fill: '#171717', edge: '#3987e5' },
  ocean: { fill: '#0f1720', edge: '#38b2d8' },
  forest: { fill: '#101a14', edge: '#4caf72' },
  mangolila: { fill: '#1e1827', edge: '#e8703a' },
  paper: { fill: '#faf8f4', edge: '#2a78d6' },
  mono: { fill: '#f7f7f7', edge: '#404040' },
}

function select(key: string): void {
  themeStore.setTheme(key as ThemeId)
}
</script>

<script lang="ts">
import { h } from 'vue'
</script>

<template>
  <NDropdown
    :options="options"
    :value="themeStore.current"
    trigger="click"
    @select="select"
  >
    <NButton size="small" quaternary :title="`Theme: ${themeStore.info.label}`">
      <template #icon>
        <NIcon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none" />
          </svg>
        </NIcon>
      </template>
      <span class="hidden sm:inline">{{ themeStore.info.label }}</span>
    </NButton>
  </NDropdown>
</template>
