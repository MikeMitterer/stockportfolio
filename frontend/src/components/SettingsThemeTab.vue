<script setup lang="ts">
/** Reiter „Darstellung" der Einstellungen: eine Kachel je Theme. */
import { useI18n } from 'vue-i18n'
import { NCard } from 'naive-ui'
import { THEME_IDS, THEMES } from '@mmit/ux-foundation'
import { useThemeStore } from '@/stores/theme'

const { t } = useI18n()
const themeStore = useThemeStore()

const themes = THEME_IDS.map((id) => THEMES[id])
</script>

<template>
  <NCard :bordered="false" class="settings__card">
    <template #header>
      <span class="settings__card-title">{{ t('settings.themeHeading') }}</span>
    </template>

    <!--
      Kacheln statt Auswahlliste: Ein Theme wählt man nach dem Aussehen,
      nicht nach dem Namen. Die Vorschau zeigt Fläche, Karte, Text und
      Akzentfarbe — dieselben vier Farben, die die Oberfläche prägen.
    -->
    <div class="settings__themes">
      <button
        v-for="theme in themes"
        :key="theme.id"
        type="button"
        class="theme-tile"
        :class="{ 'theme-tile--active': themeStore.current === theme.id }"
        :aria-pressed="themeStore.current === theme.id"
        @click="themeStore.setTheme(theme.id)"
      >
        <span class="theme-tile__preview" :style="{ backgroundColor: theme.preview.page }">
          <span class="theme-tile__card" :style="{ backgroundColor: theme.preview.card }"></span>
          <span class="theme-tile__ink" :style="{ backgroundColor: theme.preview.ink }"></span>
          <span
            class="theme-tile__accent"
            :style="{ backgroundColor: theme.preview.accent }"
          ></span>
        </span>

        <span class="theme-tile__name">
          <span class="theme-tile__label">{{ t(`settings.themeNames.${theme.id}`) }}</span>
          <span v-if="themeStore.current === theme.id" class="theme-tile__active">
            {{ t('settings.themeActive') }}
          </span>
        </span>
        <span class="theme-tile__hint">
          {{ t(`settings.themeHints.${theme.id}`) }}
        </span>
      </button>
    </div>
  </NCard>
</template>

<style scoped lang="scss">
@use '@/assets/settings-form' as *;

@include settings-form;

.settings__themes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);

  @include up(md) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Eine Kachel je Theme: Vorschau, Name, ein Satz dazu. */
.theme-tile {
  @include stack;

  padding: var(--space-3);
  border: 1px solid token(--border-default);
  border-radius: var(--radius-lg);
  text-align: left;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: token(--text-muted);
  }

  &--active {
    border-color: token(--accent);
  }

  /*
   * Die Vorschaufarben stehen fest in `themes.ts`, nicht in den Variablen:
   * Die Token eines nicht aktiven Themes gibt es im Dokument nicht.
   */
  &__preview {
    @include row(0.375rem);

    height: 3rem;
    padding: 0 var(--space-2);
    border-radius: var(--radius-sm);
  }

  &__card,
  &__ink,
  &__accent {
    height: 2rem;
    border-radius: 0.25rem;
  }

  &__card {
    flex: 1;
  }
  &__ink {
    width: 0.5rem;
  }
  &__accent {
    width: 1rem;
  }

  &__name {
    @include row;
  }

  &__label {
    font-size: var(--font-sm);
    font-weight: 500;
  }

  &__active {
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: token(--accent);
  }

  &__hint {
    @include muted;

    line-height: 1.25;
  }
}
</style>
