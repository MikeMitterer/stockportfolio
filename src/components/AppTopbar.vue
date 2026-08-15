<script setup lang="ts">
import { computed, h, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon } from 'naive-ui'
import { RouterLink, useRoute } from 'vue-router'

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
  rebalancing: () =>
    h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M4 7h11M4 7l3-3M4 7l3 3', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      h('path', { d: 'M20 17H9M20 17l-3-3M20 17l-3 3', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
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
  { name: 'rebalancing', label: t('nav.rebalancing') },
  { name: 'instruments', label: t('nav.instruments') },
  { name: 'settings', label: t('nav.settings') },
])

const isActive = (name: string): boolean => route.name === name
</script>

<template>
  <header class="topbar">
    <div class="topbar__inner">
      <!-- Plakette + Wortmarke, wie im Backend-Frontend -->
      <RouterLink :to="{ name: 'dashboard' }" class="topbar__brand">
        <span class="topbar__badge">
          <svg
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
        <span class="topbar__wordmark">{{ t('app.title') }}</span>
      </RouterLink>

      <nav class="topbar__nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="topbar__item"
          :class="{ 'topbar__item--active': isActive(item.name) }"
        >
          <NIcon :size="15">
            <component :is="ICONS[item.name]" />
          </NIcon>
          <!--
            Unterhalb md fällt die Beschriftung weg, nicht der Punkt: Vier
            Symbole passen auf jedes Telefon, ein Hamburger kostete einen
            zusätzlichen Griff.
          -->
          <span class="topbar__label">{{ item.label }}</span>
          <span class="visually-hidden">{{ item.label }}</span>
          <!-- Aktiver Eintrag: Unterstrich in Akzentfarbe, wie im Backend -->
          <span v-if="isActive(item.name)" class="topbar__underline"></span>
        </RouterLink>
      </nav>

      <div class="topbar__actions">
        <span v-if="lastRefreshLabel" class="topbar__age tabular-nums">
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
          <span class="topbar__refresh-label">{{ t('actions.refresh') }}</span>
        </NButton>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid token(--border-bar);
  background-color: token(--surface-header, 0.92);
  backdrop-filter: blur(8px);
  /*
   * Eigene Textfarbe, nicht die des Inhalts: Ein Theme darf die Leiste
   * umkehren — dunkle Leiste über hellem Inhalt. Ohne diese Zeile bliebe die
   * Wortmarke dunkel auf dunklem Grund.
   */
  color: token(--text-bar);

  &__inner {
    @include row(var(--space-3));
    @include content-frame(0);

    height: 3.5rem;

    @include up(md) { gap: var(--space-6); }
  }

  &__brand {
    @include row(0.625rem);

    &:hover { opacity: 0.9; }
  }

  &__badge {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, token(--brand-from), token(--brand-to));

    svg {
      width: 1rem;
      height: 1rem;
    }
  }

  &__wordmark {
    display: none;
    font-family: var(--font-display);
    font-size: var(--font-lg);
    font-weight: 600;
    letter-spacing: -0.015em;

    @include up(sm) { display: inline; }
  }

  &__nav {
    @include row(var(--space-1));
  }

  &__item {
    position: relative;
    @include row(0.375rem);
    padding: 0.375rem var(--space-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-sm);
    color: token(--text-bar-secondary);
    transition: color 0.15s ease, background-color 0.15s ease;

    &:hover {
      background-color: token(--surface-raised);
      color: token(--text-bar);
    }

    &--active {
      color: token(--text-bar);
    }
  }

  &__label {
    display: none;

    @include up(md) { display: inline; }
  }

  /*
   * Ein Strich, kein Kasten: Eine eingefärbte Fläche hinter dem aktiven Punkt
   * konkurriert mit den Karten darunter.
   */
  &__underline {
    position: absolute;
    right: var(--space-2);
    bottom: -9px;
    left: var(--space-2);
    height: 2px;
    border-radius: var(--radius-full);
    background-color: token(--accent);
  }

  &__actions {
    @include row(var(--space-3));
    margin-left: auto;
  }

  /*
   * Erst ab `lg`: Bei Tablet-Breite drängen die vier Beschriftungen und der
   * Knopf das Alter auf 40 Pixel zusammen, es brach dann dreizeilig um.
   * Verloren geht nichts — dieselbe Angabe steht in der Statuszeile.
   */
  &__age {
    display: none;
    font-size: var(--font-xs);
    white-space: nowrap;
    color: token(--text-bar-muted);

    @include up(lg) { display: inline; }
  }

  /*
   * Erst ab `lg`: Bei Tablet-Breite schob die Beschriftung den Knopf über den
   * rechten Rand hinaus. Das Symbol allein ist eindeutig genug.
   */
  &__refresh-label {
    display: none;

    @include up(lg) { display: inline; }
  }
}
</style>
