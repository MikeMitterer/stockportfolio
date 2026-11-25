<script setup lang="ts">
/**
 * Einstellung „Referenzindex“ (T-143): festlegen per ISIN oder Ticker,
 * anzeigen, entfernen.
 *
 * Gespeichert wird nur, was StockInfo kennt und eindeutig mit Kurs liefert.
 * Eine abgewiesene Eingabe bleibt im Feld stehen, die Meldung steht daneben —
 * sie betrifft das Feld, in das gerade getippt wurde, nicht den Datenstand.
 */
import { computed, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NInput, NText } from 'naive-ui'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/stockinfo/client'
import { resolveReferenceIndex, type ReferenceResolution } from '@/composables/useReferenceIndex'
import { useInstrumentsStore } from '@/stores/instruments'
import { useSettingsStore } from '@/stores/settings'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const instrumentsStore = useInstrumentsStore()
const client = inject<StockInfoClient | null>(STOCK_INFO_CLIENT, null)

const input = ref<string>('')
const checking = ref<boolean>(false)
const error = ref<string | null>(null)

const current = computed(() => settingsStore.settings.referenceIndex)

/** Satz zu einer abgewiesenen Eingabe. */
function describe(result: Exclude<ReferenceResolution, { ok: true }>): string {
  switch (result.reason) {
    case 'empty':
      return t('referenceIndex.empty')
    case 'unknown':
      return t('referenceIndex.unknown', { query: result.detail ?? '' })
    case 'ambiguous':
      return t('referenceIndex.ambiguous', { candidates: result.detail ?? '' })
    case 'quote':
      return t('referenceIndex.quote', { reason: result.detail ?? '' })
  }
}

async function apply(): Promise<void> {
  error.value = null
  if (!client) {
    error.value = t('referenceIndex.noClient')
    return
  }
  checking.value = true
  try {
    if (!instrumentsStore.loaded) await instrumentsStore.load(client)
    if (!instrumentsStore.loaded) {
      error.value = t('referenceIndex.catalogueFailed', { reason: instrumentsStore.error ?? '' })
      return
    }
    const result = await resolveReferenceIndex(client, instrumentsStore.instruments, input.value)
    if (!result.ok) {
      error.value = describe(result)
      return
    }
    await settingsStore.setReferenceIndex(result.value)
    input.value = ''
  } finally {
    checking.value = false
  }
}

async function remove(): Promise<void> {
  error.value = null
  await settingsStore.setReferenceIndex(null)
}
</script>

<template>
  <div class="settings__stack-wide reference-index">
    <div class="settings__inline">
      <span v-if="current" class="settings__grow reference-index__current">
        {{
          t('referenceIndex.current', {
            name: current.name,
            key: current.isin ?? current.symbol,
            currency: current.currency,
          })
        }}
      </span>
      <span v-else class="settings__grow settings__hint">{{ t('referenceIndex.none') }}</span>
      <NButton v-if="current" secondary size="small" @click="remove">
        {{ t('referenceIndex.remove') }}
      </NButton>
    </div>

    <form class="settings__inline" @submit.prevent="apply">
      <NInput
        v-model:value="input"
        class="settings__grow"
        :placeholder="t('referenceIndex.placeholder')"
        :aria-label="t('referenceIndex.heading')"
        clearable
      />
      <NButton type="primary" attr-type="submit" :loading="checking" :disabled="checking">
        {{ t('referenceIndex.apply') }}
      </NButton>
    </form>

    <NText v-if="error" type="error" class="reference-index__error">{{ error }}</NText>

    <span class="settings__hint settings__hint--wide">{{ t('referenceIndex.hint') }}</span>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/settings-form' as *;

@include settings-form;

.reference-index__current {
  font-size: var(--font-sm);
}
</style>
