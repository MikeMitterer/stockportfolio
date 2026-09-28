<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <p class="trade-notice">{{ t('tradeNotice') }}</p>
</template>

<style scoped lang="scss">
.trade-notice {
  margin: var(--space-1) 0 0;
  color: token(--text-muted);
  font-size: 0.6875rem;
  line-height: 1.45;
}
</style>
