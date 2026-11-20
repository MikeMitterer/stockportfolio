<script setup lang="ts">
/**
 * Übersicht des Altbestands aus dem Browser: Quelle, Zielkonto und die
 * gefundenen Depots. Nach dem Import lässt sich jedes Depot als Backup-Datei
 * sichern.
 */
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { NButton } from 'naive-ui'
import { useLegacyStore } from '@/stores/legacy'

defineProps<{
  /** Konto, in das der Altbestand übernommen wird. */
  username: string
  /** Ob der Altbestand bereits übernommen wurde — erst dann gibt es den Export. */
  imported: boolean
}>()

const { t } = useI18n()
const legacyStore = useLegacyStore()
const { legacyData } = storeToRefs(legacyStore)

function exportLegacy(index: number): void {
  const exported = legacyStore.exportAt(index)
  if (!exported) return
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(exported.backup, null, 2)], { type: 'application/json' }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = exported.fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <dl class="legacy-facts">
    <dt>{{ t('legacy.source') }}</dt>
    <dd>{{ t('legacy.browser') }}</dd>
    <dt>{{ t('legacy.target') }}</dt>
    <dd>{{ username }}</dd>
    <dt>{{ t('legacy.portfolios') }}</dt>
    <dd>{{ legacyData?.portfolios.length }}</dd>
  </dl>
  <ul class="legacy-list">
    <li v-for="(entry, index) in legacyData?.portfolios ?? []" :key="entry.portfolio.id">
      <span
        >{{ entry.portfolio.name }} · {{ entry.portfolio.positions.length }}
        {{ t('legacy.positions') }}</span
      >
      <NButton v-if="imported" size="small" @click="exportLegacy(index)">{{
        t('legacy.export')
      }}</NButton>
    </li>
  </ul>
</template>

<style scoped lang="scss">
.legacy-facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-2) var(--space-4);
  margin: var(--space-6) 0;
}
.legacy-facts dt {
  color: rgb(var(--text-secondary));
}
.legacy-facts dd {
  margin: 0;
}
.legacy-list {
  display: grid;
  gap: var(--space-2);
  margin: 0 0 var(--space-6);
  padding-left: var(--space-6);
}
.legacy-list li {
  padding-left: var(--space-1);
}
</style>
