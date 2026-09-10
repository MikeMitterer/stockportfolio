<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NInput, NPopconfirm, NSelect, NTag } from 'naive-ui'
import { consola } from 'consola'
import { formatAge } from '@/composables/useRelativeTime'
import { integer } from '@/domain/formatters'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { ISO_CURRENCIES } from '@/domain/fx'

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
const newCurrency = ref('EUR')
const currencyOptions = ISO_CURRENCIES.map(value => ({ value, label: value }))
const busy = ref<boolean>(false)
const error = ref<string | null>(null)

const activeId = computed(() => portfolioStore.portfolio?.id ?? null)

/** Das letzte Depot lässt sich nicht löschen — ohne Depot gäbe es nichts. */
const canDelete = computed(() => portfolioStore.all.length > 1)

async function create(): Promise<void> {
  busy.value = true
  error.value = null
  try {
    const id = await portfolioStore.createPortfolio(newName.value, newCurrency.value)
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

async function changeCurrency(id: string, currency: string): Promise<void> {
  try {
    await portfolioStore.setBaseCurrency(id, currency)
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
  <div class="depots">
    <p class="depots__intro">
      {{ t('portfolios.intro') }}
    </p>

    <div class="depots__list">
      <div
        v-for="entry in portfolioStore.all"
        :key="entry.id"
        class="depots__row"
      >
        <!--
          Der Name ist direkt editierbar, ohne Umschaltknopf: Umbenennen ist
          eine häufige Bearbeitung des Depots.
        -->
        <NInput
          :value="entry.name"
          size="small"
          class="depots__name"
          :placeholder="t('portfolios.namePlaceholder')"
          @update:value="(name: string) => rename(entry.id, name)"
        />

        <NTag v-if="entry.id === activeId" type="primary" size="small" :bordered="false">
          {{ t('portfolios.active') }}
        </NTag>

        <div class="depots__currency" :title="entry.currencyEditable ? t('fx.baseCurrency') : t('fx.currencyLocked')">
          <NSelect
            :value="entry.baseCurrency" :options="currencyOptions" filterable size="small"
            :disabled="!entry.currencyEditable || busy" :input-props="{ 'aria-label': t('fx.baseCurrency') }"
            @update:value="(currency: string) => changeCurrency(entry.id, currency)"
          />
        </div>

        <span class="depots__meta tabular-nums">
          {{ t('units.positions', entry.positionCount, { named: { count: integer(entry.positionCount) } }) }}
        </span>

        <span class="depots__meta depots__meta--wide">
          {{ t('portfolios.changed', { age: formatAge(entry.updatedAt) }) }}
        </span>

        <div class="depots__actions">
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

    <div class="depots__add">
      <NInput
        v-model:value="newName"
        size="small"
        class="depots__name"
        :placeholder="t('portfolios.newPlaceholder')"
        @keydown.enter="create"
      />
      <NButton size="small" secondary :loading="busy" @click="create">
        {{ t('portfolios.create') }}
      </NButton>
      <div class="depots__currency">
        <NSelect v-model:value="newCurrency" :options="currencyOptions" filterable size="small" :input-props="{ 'aria-label': t('fx.baseCurrency') }" />
      </div>
    </div>

    <p class="depots__meta">{{ t('fx.currencyLocked') }}</p>

    <p v-if="error" class="depots__error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
.depots {
  @include stack(var(--space-4));

  &__intro {
    font-size: var(--font-sm);
    line-height: 1.625;
    color: token(--text-secondary);
  }

  &__list {
    display: flex;
    flex-direction: column;
    border-top: 1px solid token(--border-default);
    border-bottom: 1px solid token(--border-default);
  }

  &__row {
    @include row(var(--space-3));
    flex-wrap: wrap;
    padding: var(--space-2) 0;

    & + & { border-top: 1px solid token(--border-default); }
  }

  &__name { max-width: 18rem; }
  &__currency { width: 7rem; flex-shrink: 0; }

  &__meta {
    @include muted(var(--font-xs));
    flex-shrink: 0;

    &--wide {
      display: none;

      @include up(sm) { display: inline; }
    }
  }

  &__actions {
    @include row(var(--space-2));
    margin-left: auto;
  }

  &__row > &__meta { white-space: nowrap; }

  &__row > &__name {
    flex-basis: 100%;
    max-width: none;
    @include up(md) { flex-basis: auto; max-width: 18rem; }
  }

  &__add {
    @include row(var(--space-2));
    flex-wrap: wrap;
  }

  &__error {
    font-size: var(--font-sm);
    color: token(--status-out);
  }
}
</style>
