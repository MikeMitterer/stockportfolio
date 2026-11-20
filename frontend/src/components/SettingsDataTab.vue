<script setup lang="ts">
/**
 * Reiter „Daten" der Einstellungen: Zeitraum des Rückblicks, Kursbeschaffung
 * und Depot-Verwaltung.
 */
import { useI18n } from 'vue-i18n'
import { NButton, NButtonGroup, NCard, NInputNumber, NSwitch } from 'naive-ui'
import PortfolioManager from '@/components/PortfolioManager.vue'
import { HISTORY_PERIODS, HISTORY_PERIOD_INFO } from '@/domain/historyPeriod'
import { useSettingsStore } from '@/stores/settings'
import type { HistoryPeriod } from '@/types/portfolio'

const { t } = useI18n()
const settingsStore = useSettingsStore()

const historyPeriods = HISTORY_PERIODS.map((id) => HISTORY_PERIOD_INFO[id])

async function setHistoryPeriod(value: HistoryPeriod): Promise<void> {
  await settingsStore.patch({ ui: { ...settingsStore.settings.ui, historyPeriod: value } })
}

/**
 * Beide Felder gehen einzeln, ohne das jeweils andere zu verlieren — `patch`
 * ersetzt `refresh` als Ganzes, der bestehende Stand muss also mit hinein.
 */
async function setAutoOnLoad(autoOnLoad: boolean): Promise<void> {
  await settingsStore.patch({
    refresh: { ...settingsStore.settings.refresh, autoOnLoad },
  })
}

async function setStaleAfterMinutes(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.patch({
    refresh: { ...settingsStore.settings.refresh, staleAfterMinutes: value },
  })
}
</script>

<template>
  <!--
    Zwei Spalten wie im Reiter „Berechnung": Über die volle Breite eines
    großen Schirms gezogen, stehen in einem Block mit drei Knöpfen zwei
    Handbreit Leere.

    Die Depot-Verwaltung nimmt die volle Zeile — sie ist eine Liste mit
    Namensfeld, Kennzeichnung und Zahlen je Zeile und wird schmal eng.
  -->
  <div class="settings__columns">
    <NCard :bordered="false" class="settings__card settings__card--full">
      <template #header>
        <span class="settings__card-title">{{ t('history.periodHeading') }}</span>
      </template>

      <div class="settings__group settings__group--tight">
        <NButtonGroup size="small">
          <NButton
            v-for="entry in historyPeriods"
            :key="entry.id"
            :type="entry.id === settingsStore.settings.ui.historyPeriod ? 'primary' : 'default'"
            :secondary="entry.id !== settingsStore.settings.ui.historyPeriod"
            @click="setHistoryPeriod(entry.id)"
          >
            {{ t(`history.periodNames.${entry.id}`) }}
          </NButton>
        </NButtonGroup>
        <span class="settings__hint settings__hint--wide">
          {{ t('history.periodHint') }}
        </span>
      </div>
    </NCard>

    <!--
      Kursbeschaffung steht bei den Daten, nicht beim Rechnen: Sie
      bestimmt, woher die Zahlen kommen, nicht wie mit ihnen gerechnet
      wird. Der Schalter steht über der Frist, weil er darüber
      entscheidet, ob sie überhaupt gilt.
    -->
    <NCard :bordered="false" class="settings__card settings__card--full">
      <template #header>
        <span class="settings__card-title">{{ t('settings.refreshHeading') }}</span>
      </template>

      <div class="settings__stack-wide">
        <!--
          Ein Schalter steht auf einer Linie mit seiner Beschriftung,
          nicht darunter: Er ist der Wert selbst, kein Feld, das man
          ausfüllt. Im senkrechten Stapel wie beim Zahlenfeld sah er aus,
          als wäre er eine Zeile verrutscht.
        -->
        <label class="settings__field">
          <span class="settings__switch">
            <span class="settings__label">{{ t('settings.autoOnLoad') }}</span>
            <NSwitch
              :value="settingsStore.settings.refresh.autoOnLoad"
              @update:value="setAutoOnLoad"
            />
          </span>
          <span class="settings__hint">{{ t('settings.autoOnLoadHint') }}</span>
        </label>

        <label class="settings__field">
          <span class="settings__label">{{ t('settings.staleAfter') }}</span>
          <NInputNumber
            :disabled="!settingsStore.settings.refresh.autoOnLoad"
            :value="settingsStore.settings.refresh.staleAfterMinutes"
            :min="1"
            :max="1440"
            :step="15"
            @update:value="setStaleAfterMinutes"
          />
          <span class="settings__hint">{{ t('settings.staleAfterHint') }}</span>
        </label>
      </div>
    </NCard>

    <NCard :bordered="false" class="settings__card settings__card--wide">
      <template #header>
        <span class="settings__card-title">{{ t('portfolios.heading') }}</span>
      </template>

      <PortfolioManager />
    </NCard>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/settings-form' as *;

@include settings-form;
</style>
