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
  /**
   * Wert, den ein geleertes Feld übernimmt. Ohne diese Angabe wird ein leeres
   * Feld verworfen.
   *
   * Der Unterschied hängt daran, was Leere in der jeweiligen Spalte bedeutet.
   * Beim Bestand nichts — wer das Feld leert und wegklickt, will seine 500
   * Stück nicht auf null setzen. Bei einer geplanten Stückzahl dagegen heißt
   * leer genau das: kein Trade. Dort ist es zumutbar, „0" tippen zu müssen,
   * hier war es eine Schikane.
   */
  emptyValue?: number
}>()

/**
 * Ein Klick-Ziel zum Leeren gibt es nur dort, wo Leere überhaupt etwas
 * bedeutet — und nur, wenn gerade etwas drinsteht.
 */
const clearable = computed(
  () => props.emptyValue !== undefined && !props.disabled && props.value !== props.emptyValue,
)

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
  if (props.disabled) return 'text-ink-muted cursor-default'
  if (props.invalid) return 'text-status-out'
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
 * Ein leeres Feld ergibt `emptyValue`, sonst `NaN` (und damit kein Commit).
 * `Number('')` wäre 0 — stiller Datenverlust in jeder Spalte, in der Leere
 * nichts bedeutet.
 */
function parseDraft(): number {
  const raw = draft.value
  if (typeof raw === 'number') return raw
  const trimmed = raw.trim()
  if (trimmed === '') return props.emptyValue ?? Number.NaN
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

/** Setzt auf den Leerwert zurück, ohne den Editor zu öffnen. */
function clear(): void {
  if (props.emptyValue === undefined) return
  editing.value = false
  emit('commit', props.emptyValue)
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
    Umschließender Rahmen nur zur Verankerung des Löschkreuzes: Es liegt
    absolut über der Zelle, damit weder Zeilenhöhe noch Spaltenbreite davon
    abhängen, ob gerade ein Wert drinsteht.
  -->
  <div class="relative group/inline">
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
      class="inline-number-field block w-full min-w-0 bg-transparent text-right tabular-nums px-1.5 py-0.5 outline-none border-0 border-b border-solid border-accent text-ink"
      @blur="commit"
      @keydown="onKeydown"
    />

    <button
      v-else
      type="button"
      class="block w-full min-w-0 text-right tabular-nums px-1.5 py-0.5 border-0 border-b border-solid border-transparent transition-colors hover:border-edge"
      :class="textClass"
      :disabled="disabled"
      :title="disabled ? undefined : 'Klicken zum Ändern'"
      @click.stop="startEdit"
    >
      {{ display }}
    </button>

    <!--
      Links, wo die rechtsbündige Zahl nicht hinreicht. Blass, bis die Maus
      über der Zelle steht — sonst stünde in jeder Zeile ein Kreuz und die
      Tabelle sähe aus wie ein Formular.
    -->
    <button
      v-if="clearable && !editing"
      type="button"
      class="absolute left-0 top-1/2 -translate-y-1/2 leading-none px-1 text-ink-muted
             opacity-0 transition-opacity hover:text-status-out
             group-hover/inline:opacity-100 focus-visible:opacity-100"
      title="Wert löschen"
      aria-label="Wert löschen"
      @click.stop="clear"
    >
      &times;
    </button>
  </div>
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
  /* Zahlenfelder bringen eine Eigenbreite mit — sie würde die Spalte sprengen. */
  width: 100%;
}
</style>
