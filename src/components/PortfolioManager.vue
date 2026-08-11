<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NInput, NPopconfirm, NTag } from 'naive-ui'
import { consola } from 'consola'
import { formatAge } from '@/composables/useRelativeTime'
import { integer } from '@/domain/formatters'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'

/**
 * Verwaltung mehrerer Depots.
 *
 * Nützlich, wenn man mehr als eine Aufteilung führt — etwa das eigene Depot
 * und eines für die Kinder, oder eine Variante zum Durchrechnen, bevor man
 * sie übernimmt.
 *
 * Welches Depot gerade gilt, steht in den Einstellungen (`activePortfolioId`)
 * und in der Statuszeile. Ohne diese Anzeige wäre jede Zahl der App
 * mehrdeutig, sobald es mehr als ein Depot gibt.
 */

const { t } = useI18n()

const portfolioStore = usePortfolioStore()
const settingsStore = useSettingsStore()

const newName = ref<string>('')
const busy = ref<boolean>(false)
const error = ref<string | null>(null)

const activeId = computed(() => portfolioStore.portfolio?.id ?? null)

/** Das letzte Depot lässt sich nicht löschen — ohne Depot gäbe es nichts. */
const canDelete = computed(() => portfolioStore.all.length > 1)

async function create(): Promise<void> {
  busy.value = true
  error.value = null
  try {
    const id = await portfolioStore.createPortfolio(newName.value)
    await settingsStore.setActivePortfolio(id)
    newName.value = ''
  } catch (cause) {
    error.value = messageOf(cause)
    consola.error('portfolio: Anlegen fehlgeschlagen', { reason: error.value })
  } finally {
    busy.value = false
  }
}

async function activate(id: string): Promise<void> {
  if (id === activeId.value) return
  busy.value = true
  error.value = null
  try {
    await portfolioStore.switchTo(id)
    await settingsStore.setActivePortfolio(id)
  } catch (cause) {
    error.value = messageOf(cause)
  } finally {
    busy.value = false
  }
}

async function rename(id: string, name: string): Promise<void> {
  try {
    await portfolioStore.renamePortfolio(id, name)
  } catch (cause) {
    error.value = messageOf(cause)
  }
}

async function remove(id: string): Promise<void> {
  busy.value = true
  error.value = null
  try {
    const nextActive = await portfolioStore.deletePortfolio(id)
    // Die Einstellungen dürfen nicht auf ein gelöschtes Depot zeigen.
    if (nextActive) await settingsStore.setActivePortfolio(nextActive)
  } catch (cause) {
    error.value = messageOf(cause)
  } finally {
    busy.value = false
  }
}

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-ink-secondary leading-relaxed">
      {{ t('portfolios.intro') }}
    </p>

    <div class="flex flex-col divide-y divide-edge border-y border-edge">
      <div
        v-for="entry in portfolioStore.all"
        :key="entry.id"
        class="flex items-center gap-3 py-2"
      >
        <!--
          Der Name ist direkt editierbar, ohne Umschaltknopf: Umbenennen ist
          die einzige Bearbeitung, die es hier gibt.
        -->
        <NInput
          :value="entry.name"
          size="small"
          class="max-w-[18rem]"
          :placeholder="t('portfolios.namePlaceholder')"
          @update:value="(name: string) => rename(entry.id, name)"
        />

        <NTag v-if="entry.id === activeId" type="primary" size="small" :bordered="false">
          {{ t('portfolios.active') }}
        </NTag>

        <span class="text-xs text-ink-muted tabular-nums">
          {{ t('units.positions', entry.positionCount, { named: { count: integer(entry.positionCount) } }) }}
        </span>

        <span class="text-xs text-ink-muted hidden sm:inline">
          {{ t('portfolios.changed', { age: formatAge(entry.updatedAt) }) }}
        </span>

        <div class="ml-auto flex items-center gap-2">
          <NButton
            v-if="entry.id !== activeId"
            size="tiny"
            secondary
            :disabled="busy"
            @click="activate(entry.id)"
          >
            {{ t('portfolios.switch') }}
          </NButton>

          <NPopconfirm :disabled="!canDelete" @positive-click="remove(entry.id)">
            <template #trigger>
              <NButton
                size="tiny"
                quaternary
                type="error"
                :disabled="!canDelete || busy"
                :title="canDelete ? undefined : t('portfolios.lastRemains')"
              >
                {{ t('actions.delete') }}
              </NButton>
            </template>
            <!--
              Der Umfang gehört in die Rückfrage: „Depot löschen?" allein sagt
              nicht, wie viel dabei verloren geht.
            -->
            {{
              t('portfolios.confirmDelete', {
                name: entry.name,
                positions: t('units.positions', entry.positionCount, {
                  named: { count: integer(entry.positionCount) },
                }),
              })
            }}
          </NPopconfirm>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <NInput
        v-model:value="newName"
        size="small"
        class="max-w-[18rem]"
        :placeholder="t('portfolios.newPlaceholder')"
        @keydown.enter="create"
      />
      <NButton size="small" secondary :loading="busy" @click="create">
        {{ t('portfolios.create') }}
      </NButton>
    </div>

    <p v-if="error" class="text-sm text-status-out">{{ error }}</p>
  </div>
</template>
