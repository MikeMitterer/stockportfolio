<script setup lang="ts">
import { computed, inject, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton } from 'naive-ui'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/stockinfo/client'
import { useRelativeTime } from '@/composables/useRelativeTime'
import { useApiStatusStore } from '@/stores/apiStatus'

const { t } = useI18n()
const client = inject<StockInfoClient>(STOCK_INFO_CLIENT) ?? null
const api = useApiStatusStore()
const checkedAgo = useRelativeTime(computed(() => api.checkedAt))
const tone = computed(() => {
  if (api.state === 'online') return 'ok'
  return api.state === 'offline' ? 'out' : 'neutral'
})
const stateLabel = computed<Record<string, string>>(() => ({
  unknown: t('statusPage.states.unknown'),
  checking: t('statusPage.states.checking'),
  online: t('statusPage.states.online'),
  offline: t('statusPage.states.offline'),
}))

onMounted(() => { void api.check(client) })
</script>

<template>
  <div class="status-page">
    <h1 class="status-page__title">{{ t('statusPage.title') }}</h1>
    <section class="status-page__card">
      <header class="status-page__header">
        <h2>{{ t('statusPage.heading') }}</h2>
        <NButton size="small" secondary :loading="api.state === 'checking'" @click="api.check(client)">
          {{ t('statusPage.recheck') }}
        </NButton>
      </header>

      <dl class="status-page__facts">
        <dt>{{ t('statusPage.address') }}</dt>
        <dd class="status-page__address">
          <a v-if="api.target" :href="api.target" target="_blank" rel="noopener noreferrer">{{ api.target }}</a>
          <span v-else>{{ t('statusPage.noAddress') }}</span>
        </dd>

        <dt>{{ t('statusPage.state') }}</dt>
        <dd class="status-page__state">
          <span class="status-page__light" :class="`status-page__light--${tone}`" aria-hidden="true"></span>
          <span class="status-page__state-label" :class="`status-page__state-label--${tone}`">{{ stateLabel[api.state] }}</span>
          <span v-if="api.status" class="status-page__secondary">{{ t('statusPage.reports', { status: api.status }) }}</span>
        </dd>

        <template v-if="api.version">
          <dt>{{ t('statusPage.version') }}</dt>
          <dd class="tabular-nums">{{ api.version }}</dd>
        </template>
        <template v-if="api.latencyMs !== null">
          <dt>{{ t('statusPage.latency') }}</dt>
          <dd class="tabular-nums">{{ t('statusPage.latencyUnit', { ms: api.latencyMs }) }}</dd>
        </template>
        <template v-if="api.checkedAt">
          <dt>{{ t('statusPage.checked') }}</dt>
          <dd class="status-page__secondary">{{ checkedAgo }}</dd>
        </template>
        <template v-if="api.error">
          <dt>{{ t('statusPage.reason') }}</dt>
          <dd class="status-page__error">{{ api.error }}</dd>
        </template>
      </dl>
      <p v-if="api.state === 'offline'" class="status-page__note">{{ t('statusPage.offlineHint') }}</p>
    </section>
  </div>
</template>

<style scoped lang="scss">
.status-page {
  @include content-frame(var(--space-8));

  &__title { margin: 0 0 var(--space-4); font-family: var(--font-display); font-size: 1.5rem; }
  &__card {
    @include card-surface;
    padding: var(--space-6);
    box-shadow: var(--shadow-sm);
  }
  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
    h2 { margin: 0; font-family: var(--font-display); font-size: 1.25rem; }
  }
  &__facts {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-3) var(--space-6);
    margin: 0;
    font-size: var(--font-sm);
    @include up(sm) { grid-template-columns: 10rem minmax(0, 1fr); }
    dt { color: token(--text-muted); }
    dd { margin: 0; }
  }
  &__address { overflow-wrap: anywhere; }
  &__address a { color: token(--accent); }
  &__state { @include row; }
  &__light {
    display: inline-block;
    flex-shrink: 0;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: var(--radius-full);
    background: token(--text-muted);
    &--ok { background: token(--status-ok); }
    &--out { background: token(--status-out); }
  }
  &__state-label {
    &--ok { color: token(--status-ok); }
    &--out { color: token(--status-out); }
    &--neutral { color: token(--text-muted); }
  }
  &__secondary { color: token(--text-secondary); }
  &__error { color: token(--status-out); overflow-wrap: anywhere; }
  &__note { margin: var(--space-4) 0 0; color: token(--text-secondary); line-height: 1.625; }
}
</style>
