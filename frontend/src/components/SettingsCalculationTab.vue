<script setup lang="ts">
/**
 * Reiter „Berechnung" der Einstellungen: Auslöser des Rebalancings, Bänder
 * mit Mindestgröße einer Order und Sicherheitspuffer.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NCard, NDatePicker, NInputNumber, NRadio, NRadioGroup, NSpace } from 'naive-ui'
import AmountSettingField from '@/components/AmountSettingField.vue'
import InfoHint from '@/components/InfoHint.vue'
import { shortDate } from '@/domain/formatters'
import {
  REBALANCING_TRIGGERS,
  daysUntilDue,
  nextDueDate,
  usesBands,
  usesCalendar,
} from '@/domain/schedule'
import { useSettingsStore } from '@/stores/settings'
import { usePortfolioStore } from '@/stores/portfolio'
import type { AmountSetting, RebalancingTrigger } from '@/types/portfolio'

defineProps<{
  /** Gesamtvermögen — nur als Bezugsgröße für die Puffer-Vorschau. */
  total: number
}>()

const { t } = useI18n()
const settingsStore = useSettingsStore()
const portfolioStore = usePortfolioStore()

const triggerOptions = computed(() =>
  REBALANCING_TRIGGERS.map((value) => ({
    value,
    label: t(`settings.trigger.${value}`),
    hint: t(`settings.triggerHint.${value}`),
  })),
)

const bandsActive = computed(() => usesBands(settingsStore.settings.rebalancing.trigger))
const calendarActive = computed(() => usesCalendar(settingsStore.settings.rebalancing.trigger))

/** Das Datumsfeld arbeitet mit Zeitstempeln, gespeichert wird ein ISO-Datum. */
const lastRebalancedStamp = computed(() => {
  const stored = portfolioStore.portfolio?.lastRebalancedAt
  if (!stored) return null
  const parsed = new Date(stored)
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
})

/** Wann der nächste Termin ansteht — oder dass noch nie ausgeglichen wurde. */
const scheduleHint = computed(() => {
  const stored = portfolioStore.portfolio?.lastRebalancedAt ?? null
  const months = settingsStore.settings.rebalancing.intervalMonths
  const days = daysUntilDue(stored, months, new Date())
  if (days === null) return t('settings.neverRebalanced')
  if (days <= 0) return t('settings.dueSince', { days: Math.abs(days) })
  return t('settings.dueIn', { days, date: shortDate(nextDueDate(stored, months)) })
})

async function setTrigger(trigger: RebalancingTrigger): Promise<void> {
  await settingsStore.patch({
    rebalancing: { ...settingsStore.settings.rebalancing, trigger },
  })
}

async function setIntervalMonths(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.patch({
    rebalancing: { ...settingsStore.settings.rebalancing, intervalMonths: value },
  })
}

async function setLastRebalanced(stamp: number | null): Promise<void> {
  await portfolioStore.markRebalanced(stamp === null ? null : new Date(stamp).toISOString())
}

async function markToday(): Promise<void> {
  await portfolioStore.markRebalanced(new Date().toISOString())
}

async function setLowerBand(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.setBands({ ...settingsStore.settings.bands, lowerPercent: value })
}

async function setUpperBand(value: number | null): Promise<void> {
  if (value === null) return
  await settingsStore.setBands({ ...settingsStore.settings.bands, upperPercent: value })
}

async function setSecurityBuffer(securityBuffer: AmountSetting): Promise<void> {
  await portfolioStore.setAmountSetting('securityBuffer', securityBuffer)
}

async function setMinTradeSize(minTradeSize: AmountSetting): Promise<void> {
  await portfolioStore.setAmountSetting('minTradeSize', minTradeSize)
}
</script>

<template>
  <!--
    Zwei Spalten, aber in Lesereihenfolge: Auslöser, dann die Grenzen,
    die er verwendet, dann die Liquidität. Über die volle Breite stünde
    neben dem Auslöser nur Leere.
  -->
  <div class="settings__columns">
    <!--
      Der Auslöser steht über den Bändern, weil er bestimmt, ob sie
      überhaupt gelten. Umgekehrt gelesen ergäbe die Seite keinen Sinn.
    -->
    <NCard :bordered="false" class="settings__card settings__card--full">
      <template #header>
        <span class="settings__card-title settings__card-title--hinted">
          {{ t('settings.triggerHeading') }}
          <InfoHint :text="t('hints.trigger')" anchor="trigger" />
        </span>
      </template>

      <div class="settings__cards">
        <NRadioGroup :value="settingsStore.settings.rebalancing.trigger" @update:value="setTrigger">
          <NSpace vertical>
            <NRadio v-for="option in triggerOptions" :key="option.value" :value="option.value">
              <span class="settings__option">{{ option.label }}</span>
              <span class="settings__option-hint">{{ option.hint }}</span>
            </NRadio>
          </NSpace>
        </NRadioGroup>

        <!--
          Termin und Datum nur, wenn ein Kalender im Spiel ist — sonst
          stünden hier Felder, die auf nichts wirken.
        -->
        <div v-if="calendarActive" class="settings__pair">
          <label class="settings__field">
            <span class="settings__label">{{ t('settings.intervalMonths') }}</span>
            <NInputNumber
              :value="settingsStore.settings.rebalancing.intervalMonths"
              :min="1"
              :max="120"
              :step="1"
              @update:value="setIntervalMonths"
            />
            <span class="settings__hint">{{ t('settings.intervalHint') }}</span>
          </label>

          <label class="settings__field">
            <span class="settings__label">
              {{
                t('settings.lastRebalanced', {
                  depot: portfolioStore.portfolio?.name ?? '',
                })
              }}
            </span>
            <div class="settings__inline">
              <NDatePicker
                class="settings__grow"
                type="date"
                clearable
                :value="lastRebalancedStamp"
                @update:value="setLastRebalanced"
              />
              <NButton secondary @click="markToday">{{ t('settings.markToday') }}</NButton>
            </div>
            <span class="settings__hint">{{ scheduleHint }}</span>
          </label>
        </div>
      </div>
    </NCard>

    <NCard :bordered="false" class="settings__card settings__card--full">
      <template #header>
        <span class="settings__card-title settings__card-title--hinted">
          {{ t('settings.bandsHeading') }}
          <InfoHint :text="t('hints.bands')" anchor="bands" />
        </span>
      </template>

      <div class="settings__pair">
        <label class="settings__field">
          <span class="settings__label">{{ t('bands.lower') }} (%)</span>
          <NInputNumber
            :disabled="!bandsActive"
            :value="settingsStore.settings.bands.lowerPercent"
            :min="0"
            :max="100"
            :step="1"
            :precision="1"
            @update:value="setLowerBand"
          />
          <span class="settings__hint">
            {{ t('settings.lowerHint') }}
          </span>
        </label>

        <label class="settings__field">
          <span class="settings__label">{{ t('bands.upper') }} (%)</span>
          <NInputNumber
            :disabled="!bandsActive"
            :value="settingsStore.settings.bands.upperPercent"
            :min="0"
            :max="100"
            :step="1"
            :precision="1"
            @update:value="setUpperBand"
          />
          <span class="settings__hint">
            {{ t('settings.upperHint') }}
          </span>
        </label>
      </div>

      <div class="settings__below">
        <!--
          Bänder sind relativ zum Ziel — das löst zwar die Blindheit bei
          kleinen Positionen, macht sie aber in Euro überempfindlich: Ein
          Ziel von 2 % mit 6 % Band meldet sich bei 120 €. Dafür lohnt
          keine Order. Die Mindestgröße zieht darunter eine Grenze; die
          Abweichung bleibt sichtbar, nur das Signal unterbleibt.
        -->
        <AmountSettingField
          :label="t('settings.minTradeSize')"
          :setting="
            portfolioStore.portfolio?.amountSettings?.minTradeSize ??
            settingsStore.settings.minTradeSize
          "
          :total="total"
          :hint="t('hints.minTradeSize')"
          anchor="bands"
          :zero-hint="t('settings.minTradeUnset')"
          :absolute-step="100"
          @update="setMinTradeSize"
        />
      </div>
    </NCard>

    <NCard :bordered="false" class="settings__card settings__card--full">
      <template #header>
        <span class="settings__card-title">{{ t('settings.metricsHeading') }}</span>
      </template>

      <div class="settings__stack-wide">
        <!--
          Zwei Lesarten des Puffers, beide gültig: ein Notgroschen ist ein
          fester Betrag und wächst nicht mit dem Depot; ein Liquiditätsanteil
          ist ein Prozentsatz. Statt eine Auslegung zu erzwingen, steht die
          Wahl hier — mit dem daraus folgenden Euro-Betrag als Kontrolle.
        -->
        <AmountSettingField
          :label="t('settings.securityBuffer')"
          :setting="
            portfolioStore.portfolio?.amountSettings?.securityBuffer ??
            settingsStore.settings.securityBuffer
          "
          :total="total"
          :hint="t('hints.securityBuffer')"
          anchor="reserve"
          :zero-hint="t('settings.bufferUnset')"
          @update="setSecurityBuffer"
        />
      </div>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/settings-form' as *;

@include settings-form;
</style>
