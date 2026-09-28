<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <p class="trade-notice">{{ t('tradeNotice') }}</p>
</template>

<style scoped lang="scss">
.trade-notice {
  margin: var(--space-2) 0 0;
  color: token(--text-secondary);
  font-size: var(--font-xs);
  line-height: 1.5;
}
</style>
