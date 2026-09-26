<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NTooltip } from 'naive-ui'
import { useIsCompact } from '@mmit/ux-foundation'

defineProps<{
  type: string | null
  label: string
}>()
const isCompact = useIsCompact()
const show = ref(false)
</script>

<template>
  <span v-if="type" class="asset-type">
    <NTooltip v-model:show="show" :trigger="isCompact ? 'click' : 'hover'">
      <template #trigger>
        <NButton text size="tiny" :data-asset-type="type" :aria-label="`${label}: ${type}`" @click.stop @focus="!isCompact && (show = true)" @blur="show = false" @keydown.esc="show = false">
          <!-- Microsoft Codicons tag, CC BY 4.0; THIRD_PARTY_NOTICES.md. -->
          <svg class="asset-type__icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M11 6C10.4477 6 10 5.55228 10 5C10 4.44772 10.4477 4 11 4C11.5523 4 12 4.44772 12 5C12 5.55228 11.5523 6 11 6ZM2.58722 10.1357C1.80426 9.3566 1.80426 8.0934 2.58722 7.31428L7.32688 2.59785C7.70082 2.22574 8.20735 2.01572 8.73617 2.01353L11.9867 2.00002C13.1029 1.99538 14.008 2.89877 13.9999 4.00947L13.9755 7.3725C13.9717 7.89662 13.7608 8.3982 13.3884 8.76882L8.71865 13.4157C7.93569 14.1948 6.66627 14.1948 5.88331 13.4157L2.58722 10.1357ZM3.29605 8.01964C2.90458 8.4092 2.90458 9.0408 3.29606 9.43036L6.59214 12.7103C6.98362 13.0999 7.61834 13.0999 8.00982 12.7103L12.6795 8.06346C12.8658 7.87815 12.9712 7.62736 12.9731 7.3653L12.9975 4.00227C13.0016 3.44692 12.549 2.99522 11.9909 2.99754L8.74036 3.01105C8.47595 3.01215 8.22268 3.11716 8.03571 3.30321L3.29605 8.01964Z" /></svg>
        </NButton>
      </template>
      <span class="asset-type__text">{{ label }}: {{ type }}</span>
    </NTooltip>
  </span>
</template>

<style scoped lang="scss">
.asset-type {
  display: inline-flex;
  flex-shrink: 0;
  align-self: center;

  &__icon { width: 1rem; height: 1rem; color: token(--text-muted); }
  &__text { display: block; max-width: min(22rem, calc(100vw - 6rem)); overflow-wrap: anywhere; }
}
</style>
