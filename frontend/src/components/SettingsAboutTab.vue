<script setup lang="ts">
/** Reiter „About" der Einstellungen: Hinweise zu Daten und Nutzung, Lizenzen, Anbieter. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NCard } from 'naive-ui'
import { useLocaleStore } from '@/stores/locale'
import { useThemeStore } from '@/stores/theme'

const { t } = useI18n()
const localeStore = useLocaleStore()
const themeStore = useThemeStore()

const logoUrl = computed(
  () => `${import.meta.env.BASE_URL}mangolila-logo-${themeStore.isDark ? 'dark' : 'light'}.png`,
)
</script>

<template>
  <NCard :bordered="false" class="settings__card settings__card--full">
    <template #header>{{ t('about.title') }}</template>
    <div class="settings__about-layout">
      <div class="settings__about-content">
        <p>{{ t('about.intro') }}</p>
        <p>{{ t('about.data') }}</p>
        <p>{{ t('about.use') }}</p>
        <p>{{ t('about.legal') }}</p>
        <ul>
          <li>
            <a
              :href="localeStore.current === 'de' ? './LICENSE.de.txt' : './LICENSE.txt'"
              target="_blank"
              rel="noopener noreferrer"
              >{{ t('about.licenseLink') }}</a
            >
          </li>
          <li>
            <a href="./LICENSING.md" target="_blank" rel="noopener noreferrer">
              {{ t('about.licensingLink') }}
            </a>
          </li>
          <li>
            <a href="./legal.html" target="_blank" rel="noopener noreferrer">
              {{ t('about.sourceLink') }}
            </a>
          </li>
          <li>
            <a
              href="https://www.mangolila.at/impressum/haftungsausschluss-disclaimer-finanzinhalte/"
              target="_blank"
              rel="noopener noreferrer"
              >{{ t('about.financialContentLink') }}</a
            >
          </li>
        </ul>
      </div>
      <div class="settings__provider">
        <img :src="logoUrl" alt="" width="200" height="57" />
        <address class="settings__provider-address">
          <strong>{{ t('about.providerName') }}</strong
          ><br />
          {{ t('about.providerStreet') }}<br />
          {{ t('about.providerCity') }}<br />
          {{ t('about.providerCountry') }}
        </address>
        <a href="https://www.mangolila.at/" target="_blank" rel="noopener noreferrer">
          {{ t('about.websiteLink') }}
        </a>
      </div>
    </div>
  </NCard>
</template>

<style scoped lang="scss">
@use '@/assets/settings-form' as *;

@include settings-form;

.settings {
  &__about-layout {
    display: grid;
    gap: var(--space-6);

    @include up(md) {
      grid-template-columns: minmax(0, 1fr) 17rem;
    }

    a {
      color: token(--accent);
      text-decoration: none;

      &:hover {
        opacity: 0.8;
      }
      &:focus-visible {
        outline: 2px solid token(--accent);
        outline-offset: 2px;
      }
    }
  }

  &__about-content {
    min-width: 0;

    p {
      margin: 0 0 var(--space-3);
    }
    ul {
      margin: 0;
      padding-inline-start: var(--space-6);
    }
    li + li {
      margin-top: var(--space-2);
    }
  }

  &__provider {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);

    img {
      display: block;
      max-width: 100%;
      height: auto;
    }

    @include up(md) {
      border-inline-start: 1px solid token(--border-default);
      padding-inline-start: var(--space-6);
    }
  }

  &__provider-address {
    font-style: normal;
    font-size: var(--font-sm);
    line-height: 1.6;
  }
}
</style>
