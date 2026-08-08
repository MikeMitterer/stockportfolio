<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

/**
 * Zahl, die in der Tabellenzeile direkt editierbar ist.
 *
 * Sieht im Ruhezustand wie Text aus — ein Eingabefeld je Zelle würde die
 * Tabelle mit Rahmen überziehen. Erst beim Klick wird daraus ein Feld.
 * Enter oder Verlassen übernimmt, Escape verwirft.
 */
const props = defineProps<{
  value: number
  /** Formatierte Anzeige im Ruhezustand. */
  display: string
  precision?: number
  min?: number
  max?: number
  /** Hebt den Wert farblich hervor, z.B. bei ungültiger Ziel-Summe. */
  invalid?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (event: 'commit', value: number): void
}>()

const editing = ref<boolean>(false)

/**
 * Der Entwurfswert.
 *
 * Bei `<input type="number">` wandelt Vues `v-model` die Eingabe selbsttätig
 * in eine Zahl um — der Wert ist hier also mal String, mal Zahl. Beides muss
 * `parseDraft()` verkraften.
 */
const draft = ref<string | number>('')
const inputRef = ref<HTMLInputElement | null>(null)

const textClass = computed(() => {
  if (props.disabled) return 'text-neutral-600 cursor-default'
  if (props.invalid) return 'text-red-400'
  return ''
})

async function startEdit(): Promise<void> {
  if (props.disabled) return
  draft.value = String(props.value)
  editing.value = true
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}

/**
 * Liest den Entwurfswert als Zahl — akzeptiert Komma als Dezimaltrenner.
 *
 * Ein leeres Feld ergibt `NaN`, nicht 0: Wer den Wert löscht und wegklickt,
 * will die Position nicht auf null setzen. `Number('')` wäre 0 — genau der
 * stille Datenverlust, den wir nicht wollen.
 */
function parseDraft(): number {
  const raw = draft.value
  if (typeof raw === 'number') return raw
  const trimmed = raw.trim()
  if (trimmed === '') return Number.NaN
  return Number(trimmed.replace(',', '.'))
}

function commit(): void {
  if (!editing.value) return
  editing.value = false

  const parsed = parseDraft()
  if (!Number.isFinite(parsed)) return

  const clamped = Math.min(props.max ?? Number.MAX_SAFE_INTEGER, Math.max(props.min ?? 0, parsed))
  if (clamped === props.value) return

  emit('commit', clamped)
}

function cancel(): void {
  editing.value = false
}

/**
 * Ein einziger Tastatur-Handler statt zweier `@keydown`-Modifier-Varianten:
 * die kompilieren beide auf `onKeydown` und haben sich gegenseitig gestört.
 */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    commit()
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    cancel()
  }
}
</script>

<template>
  <!--
    Kein Kasten um die Eingabe: nur eine Linie unter der Zahl. Der Wert bleibt
    dort stehen, wo er auch im Ruhezustand steht — die Zeile springt nicht.
    Die Spinner-Pfeile sind ausgeblendet (siehe <style>), sie wären in einer
    schmalen Tabellenzelle nur Gedränge.
  -->
  <input
    v-if="editing"
    ref="inputRef"
    v-model="draft"
    type="number"
    :step="precision === 0 ? 1 : 0.5"
    :min="min"
    :max="max"
    class="inline-number-field w-full bg-transparent text-right tabular-nums px-1.5 py-0.5 outline-none border-b border-sky-400/70 text-sky-200"
    @blur="commit"
    @keydown="onKeydown"
  />

  <button
    v-else
    type="button"
    class="w-full text-right tabular-nums px-1.5 py-0.5 border-b border-transparent transition-colors hover:border-neutral-600"
    :class="textClass"
    :disabled="disabled"
    :title="disabled ? undefined : 'Klicken zum Ändern'"
    @click.stop="startEdit"
  >
    {{ display }}
  </button>
</template>

<style scoped>
/* Spinner-Pfeile ausblenden — in einer Tabellenzelle nur Ballast. */
.inline-number-field::-webkit-outer-spin-button,
.inline-number-field::-webkit-inner-spin-button {
  appearance: none;
  margin: 0;
}

.inline-number-field {
  appearance: textfield;
}
</style>
