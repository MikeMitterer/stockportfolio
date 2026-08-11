<script setup lang="ts">
import { computed, ref } from 'vue'
import { NAlert, NButton, NPopconfirm } from 'naive-ui'
import { consola } from 'consola'
import {
  backupFileName,
  buildBackup,
  parseBackup,
  type Backup,
} from '@/domain/backup'
import { eur } from '@/domain/formatters'
import { usePortfolioStore } from '@/stores/portfolio'
import type { Portfolio } from '@/types/portfolio'
import { useSettingsStore } from '@/stores/settings'

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

const portfolioStore = usePortfolioStore()
const settingsStore = useSettingsStore()

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
  return Number.isNaN(date.getTime()) ? 'unbekannt' : date.toLocaleString('de-AT')
})

// ─── Sichern ────────────────────────────────────────────────────────────────

function exportBackup(): void {
  const portfolio = portfolioStore.portfolio
  if (!portfolio) return

  try {
    exportNow(portfolio)
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    error.value = `Die Sicherung konnte nicht erstellt werden: ${reason}`
    consola.error('backup: Sichern fehlgeschlagen', { reason })
  }
}

function exportNow(portfolio: Portfolio): void {
  const exportedAt = new Date().toISOString()
  const backup = buildBackup(portfolio, settingsStore.settings, __APP_VERSION__, exportedAt)

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

  done.value = `Gesichert: ${anchor.download}`
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
    error.value = result.error
    done.value = null
    pending.value = null
    consola.warn('backup: Datei abgelehnt', { reason: result.error })
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
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    error.value = `Das Einspielen ist fehlgeschlagen: ${reason}`
    consola.error('backup: Einspielen fehlgeschlagen', { reason })
    pending.value = null
    return
  }

  const count = backup.portfolio.positions.length
  done.value =
    `Eingespielt: „${backup.portfolio.name}" mit ${count} Position${count === 1 ? '' : 'en'}.`
  pending.value = null
}

function discardPending(): void {
  pending.value = null
}

/** Summe der Bestände zur groben Kontrolle vor dem Überschreiben. */
const pendingCashTotal = computed(() =>
  (pending.value?.portfolio.positions ?? [])
    .filter((position) => position.group === 'cash')
    .reduce((sum, position) => sum + position.units, 0),
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-ink-secondary leading-relaxed">
      Depot und Einstellungen liegen ausschließlich in diesem Browser. Eine
      Sicherung ist die einzige Möglichkeit, sie auf ein anderes Gerät zu holen
      oder nach einem gelöschten Website-Speicher zurückzubekommen. Kurse sind
      nicht enthalten — die holt die App ohnehin neu.
    </p>

    <div class="flex flex-wrap items-center gap-3">
      <NButton type="primary" :disabled="!portfolioStore.portfolio" @click="exportBackup">
        Sicherung herunterladen
      </NButton>

      <NButton secondary @click="pickFile">Sicherung einspielen …</NButton>

      <!-- Unsichtbar: Der Knopf daneben ist das Bedienelement. -->
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        class="hidden"
        @change="onFileChosen"
      />
    </div>

    <NAlert v-if="error" type="error" :bordered="false" closable @close="error = null">
      {{ error }}
    </NAlert>

    <NAlert v-if="done" type="success" :bordered="false" closable @close="done = null">
      {{ done }}
    </NAlert>

    <!--
      Vorschau vor dem Überschreiben. Genannt wird, woran man eine falsche
      Datei erkennt: Name, Alter und Umfang — und was verloren geht.
    -->
    <div v-if="pending" class="rounded-lg border border-edge bg-raised p-4 flex flex-col gap-3">
      <span class="text-sm font-medium">Diese Sicherung einspielen?</span>

      <dl class="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
        <dt class="text-ink-muted">Depot</dt>
        <dd>{{ pending.portfolio.name }}</dd>

        <dt class="text-ink-muted">Positionen</dt>
        <dd class="tabular-nums">{{ positionCount }}</dd>

        <dt v-if="pendingCashTotal > 0" class="text-ink-muted">davon Cash</dt>
        <dd v-if="pendingCashTotal > 0" class="tabular-nums">{{ eur(pendingCashTotal) }}</dd>

        <dt class="text-ink-muted">Gesichert am</dt>
        <dd>{{ exportedAtLabel }}</dd>

        <dt class="text-ink-muted">App-Fassung</dt>
        <dd class="tabular-nums">{{ pending.appVersion }}</dd>
      </dl>

      <p class="text-xs text-status-out leading-relaxed">
        Das aktuelle Depot mit
        {{ portfolioStore.positions.length }}
        {{ portfolioStore.positions.length === 1 ? 'Position' : 'Positionen' }}
        und alle Einstellungen werden dabei ersetzt. Das lässt sich nicht
        rückgängig machen — bei Zweifeln vorher eine eigene Sicherung
        herunterladen.
      </p>

      <div class="flex items-center gap-2">
        <NPopconfirm @positive-click="applyPending">
          <template #trigger>
            <NButton type="error" size="small">Jetzt ersetzen</NButton>
          </template>
          Aktuelles Depot wirklich überschreiben?
        </NPopconfirm>
        <NButton size="small" quaternary @click="discardPending">Abbrechen</NButton>
      </div>
    </div>
  </div>
</template>
