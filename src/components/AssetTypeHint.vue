<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NTooltip } from 'naive-ui'
import { useIsCompact } from '@mmit/ux-foundation'
import AssetTypeIcon from './AssetTypeIcon.vue'

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
          <AssetTypeIcon :type="type" class="asset-type__icon" />
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

  &__icon { width: 0.875rem; height: 0.875rem; color: token(--text-muted); opacity: 0.75; }
  &__text { display: block; max-width: min(22rem, calc(100vw - 6rem)); overflow-wrap: anywhere; }
}
</style>
