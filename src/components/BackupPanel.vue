<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NPopconfirm } from 'naive-ui'
import { consola } from 'consola'
import {
  backupFileName,
  buildBackup,
  parseBackup,
  type Backup,
} from '@/domain/backup'
import { eur, formatterLocale, integer } from '@/domain/formatters'
import { usePortfolioStore } from '@/stores/portfolio'
import type { Portfolio } from '@/types/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { useAppNotification } from '@/composables/useAppNotification'
import { useInstrumentsStore } from '@/stores/instruments'

/**
 * Sichern und Wiederherstellen.
 *
 * Alles liegt im Browser — ein gelöschter Website-Speicher oder ein neues
 * Gerät heißt sonst: alles weg. Diese Datei ist das einzige Backup.
 *
 * Das Einspielen läuft absichtlich in zwei Schritten: erst Datei lesen und
 * zeigen, was drinsteht, dann bestätigen. Ein Dateidialog, der beim Loslassen
 * sofort das Depot überschreibt, wäre bei einem Fehlgriff nicht mehr
 * zurückzuholen.
 */

const { t } = useI18n()

const portfolioStore = usePortfolioStore()
const settingsStore = useSettingsStore()
const instrumentsStore = useInstrumentsStore()

const fileInput = ref<HTMLInputElement | null>(null)

/** Eingelesene, geprüfte Datei — wartet auf die Bestätigung. */
const pending = ref<Backup | null>(null)
const error = ref<string | null>(null)
const done = ref<string | null>(null)

const positionCount = computed(() => pending.value?.portfolio.positions.length ?? 0)

/** Zeitpunkt der Sicherung, lesbar. */
const exportedAtLabel = computed(() => {
  const raw = pending.value?.exportedAt
  if (!raw) return 'unbekannt'
  const date = new Date(raw)
  return Number.isNaN(date.getTime())
    ? t('backup.unknown')
    : date.toLocaleString(formatterLocale())
})

// ─── Sichern ────────────────────────────────────────────────────────────────

function exportBackup(): void {
  const portfolio = portfolioStore.portfolio
  if (!portfolio) return

  try {
    exportNow(portfolio)
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    error.value = t('backup.exportFailed', { reason })
    consola.error('backup: Sichern fehlgeschlagen', { reason })
  }
}

function exportNow(portfolio: Portfolio): void {
  const exportedAt = new Date().toISOString()
  const backup = buildBackup(
    portfolio,
    settingsStore.settings,
    instrumentsStore.allowlist,
    __APP_VERSION__,
    exportedAt,
  )

  // Eingerückt geschrieben: Die Datei soll sich im Zweifel auch von Hand lesen
  // und reparieren lassen.
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = backupFileName(portfolio.name, exportedAt)
  anchor.click()
  URL.revokeObjectURL(url)

  done.value = t('backup.saved', { file: anchor.download })
  error.value = null
}

// ─── Einspielen ─────────────────────────────────────────────────────────────

function pickFile(): void {
  error.value = null
  done.value = null
  fileInput.value?.click()
}

async function onFileChosen(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Zurücksetzen, damit dieselbe Datei erneut gewählt werden kann — sonst
  // bleibt `change` beim zweiten Versuch stumm.
  input.value = ''
  if (!file) return

  const result = parseBackup(await file.text())
  if (!result.ok) {
    // Die Domäne nennt nur den Schlüssel — den Satz baut die Anzeige, in der
    // Sprache des Nutzers.
    error.value = t(`backupErrors.${result.error.key}`, result.error.params ?? {})
    done.value = null
    pending.value = null
    consola.warn('backup: Datei abgelehnt', { reason: result.error.key })
    return
  }

  pending.value = result.backup
  error.value = null
  done.value = null
}

/**
 * Spielt die geprüfte Sicherung ein.
 *
 * Mit Auffangnetz: Schlägt das Schreiben fehl — voller Speicher, gesperrte
 * IndexedDB im privaten Modus, ein veraltetes Modul nach einem Hot-Reload —
 * blieb sonst der Dialog offen und sonst geschah nichts. Ein Vorgang, der das
 * ganze Depot ersetzt, darf nicht stumm scheitern.
 */
async function applyPending(): Promise<void> {
  const backup = pending.value
  if (!backup) return

  try {
    await portfolioStore.replacePortfolio(backup.portfolio)
    await settingsStore.replaceAll({
      ...backup.settings,
      activePortfolioId: backup.portfolio.id,
    })
    await instrumentsStore.replaceAllowlist(new Map(Object.entries(backup.allowlist)))
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    error.value = t('backup.importFailed', { reason })
    consola.error('backup: Einspielen fehlgeschlagen', { reason })
    pending.value = null
    return
  }

  const count = backup.portfolio.positions.length
  done.value = t('backup.restored', {
    name: backup.portfolio.name,
    positions: t('units.positions', count, { named: { count: integer(count) } }),
  })
  pending.value = null
}

function discardPending(): void {
  pending.value = null
}

// Meldungen als Toast, wie überall sonst. Sie erscheinen nach einem Klick und
// sollen die Karte darunter nicht auseinanderschieben.
const { notify } = useAppNotification()

notify(computed(() => error.value !== null), {
  title: t('notify.backupTitle'),
  type: 'error',
  content: () => error.value ?? '',
})

notify(computed(() => done.value !== null), {
  title: t('notify.doneTitle'),
  type: 'info',
  content: () => done.value ?? '',
})

/**
 * Wie viele Assets die Sicherung ausblendet.
 *
 * Nur die abgeschalteten sind eine Entscheidung — ein Eintrag mit `true`
 * entspricht dem Normalfall und sagt nichts.
 */
const hiddenCount = computed(
  () => Object.values(pending.value?.allowlist ?? {}).filter((enabled) => !enabled).length,
)

/** Summe der Bestände zur groben Kontrolle vor dem Überschreiben. */
const pendingCashTotal = computed(() =>
  (pending.value?.portfolio.positions ?? [])
    .filter((position) => position.group === 'cash')
    .reduce((sum, position) => sum + position.units, 0),
)
</script>

<template>
  <div class="backup">
    <p class="backup__intro">
      {{ t('backup.intro') }}
    </p>

    <div class="backup__actions">
      <NButton type="primary" :disabled="!portfolioStore.portfolio" @click="exportBackup">
        {{ t('backup.download') }}
      </NButton>

      <NButton secondary @click="pickFile">{{ t('backup.restore') }}</NButton>

      <!-- Unsichtbar: Der Knopf daneben ist das Bedienelement. -->
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        class="backup__file"
        @change="onFileChosen"
      />
    </div>

    <!--
      Vorschau vor dem Überschreiben. Genannt wird, woran man eine falsche
      Datei erkennt: Name, Alter und Umfang — und was verloren geht.
    -->
    <div v-if="pending" class="backup__preview">
      <span class="backup__heading">{{ t('backup.confirmHeading') }}</span>

      <dl class="backup__facts">
        <dt class="backup__term">{{ t('backup.portfolio') }}</dt>
        <dd>{{ pending.portfolio.name }}</dd>

        <dt class="backup__term">{{ t('backup.positions') }}</dt>
        <dd class="tabular-nums">{{ positionCount }}</dd>

        <dt v-if="pendingCashTotal > 0" class="backup__term">{{ t('backup.ofWhichCash') }}</dt>
        <dd v-if="pendingCashTotal > 0" class="tabular-nums">{{ eur(pendingCashTotal) }}</dd>

        <dt v-if="hiddenCount > 0" class="backup__term">{{ t('backup.hidden') }}</dt>
        <dd v-if="hiddenCount > 0" class="tabular-nums">
          {{ t('units.assets', hiddenCount, { named: { count: integer(hiddenCount) } }) }}
        </dd>

        <dt class="backup__term">{{ t('backup.savedAt') }}</dt>
        <dd>{{ exportedAtLabel }}</dd>

        <dt class="backup__term">{{ t('backup.appVersion') }}</dt>
        <dd class="tabular-nums">{{ pending.appVersion }}</dd>
      </dl>

      <p class="backup__warning">
        {{
          t('backup.replaceWarning', {
            positions: t('units.positions', portfolioStore.positions.length, {
              named: { count: integer(portfolioStore.positions.length) },
            }),
          })
        }}
      </p>

      <div class="backup__confirm">
        <NPopconfirm @positive-click="applyPending">
          <template #trigger>
            <NButton type="error" size="small">{{ t('backup.replaceNow') }}</NButton>
          </template>
          {{ t('backup.confirmReplace') }}
        </NPopconfirm>
        <NButton size="small" quaternary @click="discardPending">{{ t('actions.cancel') }}</NButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.backup {
  @include stack(var(--space-4));

  &__intro {
    font-size: var(--font-sm);
    line-height: 1.625;
    color: token(--text-secondary);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
  }

  /* Die Dateiauswahl bedient der Knopf daneben — sichtbar wäre sie doppelt. */
  &__file { display: none; }

  /*
   * Was hineinkommt, steht vor dem Einspielen da: Überschrieben wird nichts,
   * ohne dass man den Inhalt gesehen und bestätigt hat.
   */
  &__preview {
    @include stack(var(--space-3));
    padding: var(--space-4);
    border: 1px solid token(--border-default);
    border-radius: var(--radius-lg);
    background-color: token(--surface-raised);
  }

  &__heading {
    font-size: var(--font-sm);
    font-weight: 500;
  }

  &__facts {
    display: grid;
    grid-template-columns: 8rem minmax(0, 1fr);
    gap: 0.375rem var(--space-4);
    font-size: var(--font-sm);
  }

  &__term { @include muted(null); }

  &__warning {
    font-size: var(--font-xs);
    line-height: 1.625;
    color: token(--status-out);
  }

  &__confirm {
    @include row(var(--space-2));
  }
}
</style>
