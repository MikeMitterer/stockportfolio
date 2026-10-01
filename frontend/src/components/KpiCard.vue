<script setup lang="ts">
import InfoHint from '@/components/InfoHint.vue'
import { UxCaret } from '@mmit/ux-foundation'
import PriceSparkline from '@/components/PriceSparkline.vue'
import type { HistoryPoint } from '@/domain/sparkline'

defineProps<{
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'positive' | 'warning' | 'danger'
  /** Kurzerklärung des Begriffs; ohne sie erscheint kein Fragezeichen. */
  explanation?: string
  /** Sprungmarke auf der Methodenseite. */
  anchor?: string
  /** Reiter in den Einstellungen, in dem der zugehörige Wert steht. */
  settingsTab?: string
  /** Kurzerklärung zur Erläuterung neben der Zahl; zeigt dort ein Fragezeichen. */
  hintExplanation?: string
  /** Reiter in den Einstellungen, in dem der Wert der Erläuterung steht. */
  hintSettingsTab?: string
  /**
   * Kleine Verlaufslinie neben der Zahl.
   *
   * Der Überblick soll auf einen Blick beantworten, wohin es geht — die Zahlen
   * dazu stehen im aufgeklappten Diagramm, nicht hier.
   */
  trend?: HistoryPoint[]
  /** Macht die Karte anklickbar; zeigt einen Pfeil an. */
  expandable?: boolean
  /** Zustand des Pfeils. */
  expanded?: boolean
}>()

const emit = defineEmits<{
  (event: 'toggle'): void
}>()
</script>

<template>
  <!--
    Bewusst flach: keine Karte mit Rahmen und Fläche, nur eine Spalte mit
    feiner Trennlinie. Vier gerahmte Kästen nehmen für vier Zahlen zu viel
    Platz und Aufmerksamkeit weg von der Tabelle darunter.

    Zwei Zeilen statt drei: Die Erläuterung steht neben der Zahl, nicht
    darunter. Sie ist ohnehin nur Beiwerk und muss keine eigene Zeile Höhe
    kosten — der Kopfbereich stand sonst über der Tabelle wie ein Block.
  -->
  <!--
    Aufklappbar ist die ganze Fläche, der eigentliche Knopf ist aber nur die
    Gruppe aus Verlauf und Pfeil. Die Karte selbst darf kein Knopf sein: Ein
    Fragezeichen mit Verweisen darin wäre verschachtelte Bedienung, und jeder
    Klick darauf klappte das Diagramm mit auf.
  -->
  <div
    class="kpi"
    :class="{ 'kpi--expandable': expandable }"
    @click="expandable && emit('toggle')"
  >
    <div class="kpi__label">
      {{ label }}
      <InfoHint
        v-if="explanation"
        :text="explanation"
        :anchor="anchor"
        :settings-tab="settingsTab"
        @click.stop
      />
    </div>

    <div class="kpi__row">
      <span class="kpi__value tabular-nums" :class="`kpi__value--${tone ?? 'default'}`">
        {{ value }}
      </span>

      <!--
        Verlauf und Pfeil stehen direkt am Wert. Wird die Spalte schmal, bricht
        zuerst die Erläuterung um, nicht die Grafik. Der Knopf löst kein eigenes
        Ereignis aus: Sein Klick erreicht die Karte, auch per Tastatur.
      -->
      <component
        :is="expandable ? 'button' : 'span'"
        v-if="(trend && trend.length > 1) || expandable"
        class="kpi__aside"
        :type="expandable ? 'button' : undefined"
        :aria-expanded="expandable ? expanded : undefined"
        :aria-label="expandable ? label : undefined"
      >
        <PriceSparkline
          v-if="trend && trend.length > 1"
          class="kpi__trend"
          :points="trend"
          :width="64"
          :height="18"
        />

        <!--
          `flip`: zu zeigt nach unten, offen nach oben — „hier geht etwas auf".
        -->
        <UxCaret v-if="expandable" class="kpi__chevron" :open="!!expanded" size="sm" />
      </component>

      <span v-if="hint" class="kpi__hint" :title="hint">
        {{ hint }}
        <InfoHint
          v-if="hintExplanation"
          :text="hintExplanation"
          :settings-tab="hintSettingsTab"
          @click.stop
        />
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kpi {
  @include stack(0.125rem);
  /*
   * Untereinander gestapelt trennt eine Linie unten, nebeneinander eine
   * links. Bliebe es bei der linken, ergäben die gestapelten Kennzahlen auf
   * dem Telefon eine durchgehende Leiste am Rand, die nichts trennt.
   */
  padding: 0.375rem 0 var(--space-3);
  border-bottom: 1px solid token(--border-default);

  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  @include up(md) {
    padding: 0.375rem var(--space-4);
    border-bottom: 0;
    border-left: 1px solid token(--border-default);

    // Bei zwei Spalten beginnt die dritte Kennzahl eine neue Zeile.
    &:nth-child(odd) {
      padding-left: 0;
      border-left: 0;
    }

    &:last-child {
      padding-bottom: 0.375rem;
    }
  }

  @include up(lg) {
    // Ab vier Spalten gehört die Trennlinie wieder vor die dritte Kennzahl.
    &:nth-child(odd):not(:first-child) {
      padding-left: var(--space-4);
      border-left: 1px solid token(--border-default);
    }
  }

  &__label {
    @include row(var(--space-1));
    font-size: 0.6875rem;
    line-height: 1.25;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    @include muted(null);
  }

  &__row {
    @include row(var(--space-2), baseline);
    flex-wrap: wrap;
    min-width: 0;
  }

  &__value {
    font-size: var(--font-base);
    font-weight: 600;
    line-height: 1.25;
    /* „+€ 5.000" darf nicht zwischen Vorzeichen und Betrag umbrechen. */
    white-space: nowrap;

    &--default { color: token(--text-primary); }
    &--positive { color: token(--status-ok); }
    &--warning { color: token(--status-near); }
    &--danger { color: token(--status-out); }
  }

  &--expandable {
    cursor: pointer;

    &:hover .kpi__chevron { opacity: 1; }
  }

  /*
   * Grafik richtet sich mittig aus, nicht an der Grundlinie.
   *
   * Die Zeile steht auf `baseline` — richtig für Etikett und Betrag, die
   * dadurch auf einer Linie sitzen. Ein SVG hat seine Grundlinie aber an der
   * Unterkante: Verlauf und Pfeil sackten damit an den unteren Zeilenrand,
   * statt neben dem Wert zu stehen.
   */
  &__aside {
    @include row(var(--space-2));
    flex-shrink: 0;
    align-self: center;
    // Als Knopf ohne eigene Fläche: Er gehört optisch zur Karte.
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: inherit;

    &:focus-visible { outline: 2px solid token(--accent); outline-offset: 2px; }
  }

  &__trend { flex-shrink: 0; }

  /*
   * Form, Größe und Drehung stehen in `UxCaret` (Fundament). Hier bleibt nur,
   * was die Umgebung angeht: Der Pfeil ist gedämpft und hellt beim Überfahren
   * der Karte auf — er soll auf sich aufmerksam machen, wenn jemand ohnehin
   * hinsieht, und sonst nicht.
   */
  &__chevron {
    opacity: 0.4;
    // `transform` muss mitgeführt werden: Das Kurzschreiben setzt
    // `transition-property` neu und hätte sonst die Drehung aus `UxCaret`
    // gestrichen — der Pfeil sprang um.
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }

  &__hint {
    @include row(var(--space-1));
    flex-shrink: 0;
    max-width: 100%;
    font-size: 0.6875rem;
    line-height: 1.25;
    @include muted(null);
    overflow-wrap: anywhere;
  }
}
</style>
