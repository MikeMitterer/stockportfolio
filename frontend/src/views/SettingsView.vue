<script setup lang="ts">
import { computed, inject, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NButtonGroup, NCard, NInputNumber, NSelect, NTabPane, NTabs } from 'naive-ui'
import BackupPanel from '@/components/BackupPanel.vue'
import ExternalLinkEditor from '@/components/ExternalLinkEditor.vue'
import SettingsAboutTab from '@/components/SettingsAboutTab.vue'
import SettingsCalculationTab from '@/components/SettingsCalculationTab.vue'
import SettingsDataTab from '@/components/SettingsDataTab.vue'
import SettingsThemeTab from '@/components/SettingsThemeTab.vue'
import { usePortfolioValuation } from '@/composables/usePortfolioValuation'
import { useSettingsStore } from '@/stores/settings'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { useInstrumentsStore } from '@/stores/instruments'
import { LOCALE_IDS, LOCALES, useLocaleStore } from '@/stores/locale'
import { useInstrumentTypesStore } from '@/stores/instrumentTypes'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/stockinfo/client'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

/** Namen der Reiter — Reihenfolge wie in der Anzeige. */
const SETTINGS_TABS = [
  'calc',
  'links',
  'theme',
  'data',
  'backup',
  'notifications',
  'language',
  'about',
]
const tabOptions = computed(() =>
  SETTINGS_TABS.map((value) => ({
    label: t(`settings.tabs.${value}`),
    value,
  })),
)
const settingsStore = useSettingsStore()
const portfolioStore = usePortfolioStore()
const quotesStore = useQuotesStore()
const instrumentsStore = useInstrumentsStore()
const localeStore = useLocaleStore()

/** Gesamtvermögen — nur als Bezugsgröße für die Puffer-Vorschau. */
const { result: valuation } = usePortfolioValuation()
const total = computed(() => valuation.value?.total ?? 0)

onMounted(async () => {
  if (!portfolioStore.loaded) await portfolioStore.load()
  if (!settingsStore.loaded) await settingsStore.load(portfolioStore.portfolio?.id ?? '')
  await quotesStore.hydrate()
  // Ohne den Katalog, aber mit der Whitelist — die gehört in das Backup.
  await instrumentsStore.hydrateAllowlist()
})

/**
 * Angezeigter Reiter — aus der Adresse, mit „Berechnung" als Rückfallwert.
 *
 * Ein unbekannter Name in der Adresse landet ebenfalls dort: Ein leerer
 * Inhaltsbereich wäre die schlechtere Antwort auf einen Tippfehler.
 */
const activeTab = computed(() => {
  const requested = route.query.tab
  const name = Array.isArray(requested) ? requested[0] : requested
  return typeof name === 'string' && SETTINGS_TABS.includes(name) ? name : 'calc'
})

function setTab(name: string): void {
  void router.replace({ path: '/settings', query: { tab: name } })
}

function setTabFromSelection(value: string | number | null): void {
  if (typeof value === 'string' && SETTINGS_TABS.includes(value)) setTab(value)
}

async function setNotificationSeconds(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.patch({
    ui: { ...settingsStore.settings.ui, notificationSeconds: value },
  })
}

const locales = LOCALE_IDS.map((id) => LOCALES[id])

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT) ?? null
const instrumentTypes = useInstrumentTypesStore()
function loadInstrumentTypes(): void {
  if (client) void instrumentTypes.load(client)
}
watch(
  activeTab,
  (tab) => {
    if (tab === 'links') loadInstrumentTypes()
  },
  { immediate: true },
)
</script>

<template>
  <div class="settings">
    <h1 class="settings__title">{{ t('views.settingsTitle') }}</h1>

    <NSelect
      class="settings__mobile-tabs"
      size="large"
      :theme-overrides="{ peers: { InternalSelection: { heightLarge: '44px' } } }"
      :value="activeTab"
      :options="tabOptions"
      :aria-label="t('settings.sectionLabel')"
      @update:value="setTabFromSelection"
    />

    <!--
      Gegliedert statt gestapelt: Rechenvorgaben, Aussehen und Verweise haben
      nichts miteinander zu tun; untereinander ergaben sie eine lange Seite,
      auf der man scrollen musste, um überhaupt zu sehen, was es gibt.
      Umfangreiche Reiter stehen als eigene Komponente (`Settings*Tab.vue`).
    -->
    <!--
      Der Reiter steht in der Adresse: Nur so kann ein Hinweis anderswo in der
      App auf die zugehörige Einstellung verweisen, statt „ist irgendwo in den
      Einstellungen" zu sagen.
    -->
    <!--
      `key` an der Sprache: Naive UI misst den Schiebebalken unter dem aktiven
      Reiter beim Einhängen und beim Reiterwechsel — nicht, wenn sich die
      Beschriftungen ändern. Nach einem Sprachwechsel stand der Balken deshalb
      dauerhaft 46 Pixel neben dem Reiter. Ein Neuaufbau ist hier billig: Die
      Seite hält keinen Zustand, der dabei verloren ginge.
    -->
    <NTabs
      :key="localeStore.current"
      type="line"
      animated
      :value="activeTab"
      @update:value="setTab"
    >
      <NTabPane name="calc" :tab="t('settings.tabs.calc')">
        <SettingsCalculationTab :total="total" />
      </NTabPane>

      <NTabPane name="links" :tab="t('settings.tabs.links')">
        <NCard :bordered="false" class="settings__card">
          <template #header>
            <span class="settings__card-title">{{ t('settings.linksHeading') }}</span>
          </template>

          <ExternalLinkEditor
            :links="settingsStore.settings.links"
            :type-catalog="instrumentTypes.catalog"
            :types-loading="instrumentTypes.loading"
            :types-error="client ? instrumentTypes.error : t('notify.noClient')"
            @reload-types="loadInstrumentTypes"
            @update="settingsStore.setLinks"
            @reset="settingsStore.resetLinks"
          />
        </NCard>
      </NTabPane>

      <NTabPane name="theme" :tab="t('settings.tabs.theme')">
        <SettingsThemeTab />
      </NTabPane>

      <NTabPane name="data" :tab="t('settings.tabs.data')">
        <SettingsDataTab />
      </NTabPane>

      <NTabPane name="backup" :tab="t('settings.tabs.backup')">
        <NCard :bordered="false" class="settings__card">
          <template #header>
            <span class="settings__card-title">{{ t('backup.heading') }}</span>
          </template>

          <BackupPanel />
        </NCard>
      </NTabPane>

      <NTabPane name="notifications" :tab="t('settings.tabs.notifications')">
        <NCard :bordered="false" class="settings__card">
          <template #header>
            <span class="settings__card-title">{{ t('settings.notificationsHeading') }}</span>
          </template>

          <div class="settings__narrow">
            <!--
              Meldungen sind Zustände, keine Ereignisse: Sie verschwinden ohnehin,
              sobald ihre Ursache behoben ist. Der Zähler beendet nur das Warten
              darauf — beim Eintippen von Stückzahlen stand sonst dauerhaft ein
              Kasten im Weg.
            -->
            <label class="settings__field">
              <span class="settings__label">{{ t('settings.notificationSeconds') }}</span>
              <NInputNumber
                :value="settingsStore.settings.ui.notificationSeconds"
                :min="0"
                :max="120"
                :step="1"
                @update:value="setNotificationSeconds"
              />
              <span class="settings__hint">
                <template v-if="settingsStore.settings.ui.notificationSeconds === 0">
                  {{ t('settings.notificationKeep') }}
                </template>
                <template v-else>
                  {{ t('settings.notificationAuto') }}
                </template>
              </span>
            </label>
          </div>
        </NCard>
      </NTabPane>

      <NTabPane name="language" :tab="t('settings.tabs.language')">
        <NCard :bordered="false" class="settings__card">
          <template #header>
            <span class="settings__card-title">{{ t('settings.languageHeading') }}</span>
          </template>

          <div class="settings__group settings__group--tight">
            <NButtonGroup size="small">
              <NButton
                v-for="entry in locales"
                :key="entry.id"
                :type="entry.id === localeStore.current ? 'primary' : 'default'"
                :secondary="entry.id !== localeStore.current"
                @click="localeStore.setLocale(entry.id)"
              >
                {{ entry.label }}
              </NButton>
            </NButtonGroup>
            <span class="settings__hint settings__hint--wide">
              {{ t('settings.languageHint') }}
            </span>
          </div>
        </NCard>
      </NTabPane>

      <NTabPane name="about" :tab="t('settings.tabs.about')">
        <SettingsAboutTab />
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
/*
 * About steht rechts, abgesetzt von den konfigurierbaren Bereichen.
 *
 * Der Abstand macht den Unterschied sichtbar, statt ihn nur in die
 * Reihenfolge zu legen.
 *
 * `nth-last-child(2)`, nicht `last-of-type`: Naive UI hängt hinter den
 * letzten Reiter noch ein `.n-tabs-scroll-padding` — ebenfalls ein `div`,
 * auf das `last-of-type` gezielt hätte.
 */
:deep(.n-tabs-wrapper) {
  width: 100%;
}

:deep(.n-tabs-tab-wrapper:nth-last-child(2)) {
  margin-left: auto;
}
</style>

<style scoped lang="scss">
@use '@/assets/settings-form' as *;

@include settings-form;

.settings {
  @include content-frame(var(--space-8));

  &__mobile-tabs {
    display: none;
  }

  @include below(md) {
    &__mobile-tabs {
      display: block;
      margin-bottom: var(--space-4);
    }
    :deep(.n-tabs-nav) {
      display: none;
    }
  }

  &__title {
    margin-bottom: var(--space-4);
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 600;
  }
}
</style>
