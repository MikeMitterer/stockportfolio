<script setup lang="ts">
/**
 * Schmale Fortschrittsleiste am oberen Seitenrand.
 *
 * Zeigt, dass im Hintergrund Kurse geholt werden — gleich, wer es angestoßen
 * hat. Der Spinner am Knopf gehört dagegen allein der Handlung: Beide Anzeigen
 * beantworten verschiedene Fragen, „passiert gerade etwas?" und „ist mein Klick
 * angekommen?".
 *
 * Bewusst **nicht** `NProgress`: Dessen Spur und Füllung müssten für die Lage
 * am Seitenrand umgestylt werden, und eigenes CSS auf einer Naive-Komponente
 * ist genau das, was `componentStyles.spec.ts` verbietet. Hier gibt es kein
 * Bedienelement, nur zwei Flächen — die Bibliothek gewönne nichts.
 *
 * Kennt die App nicht (keine Stores, kein `t()`) und könnte so ins Fundament
 * ziehen, sobald eine zweite App sie braucht.
 */
const props = defineProps<{
  /** Läuft gerade etwas? Nur dann steht die Leiste im Dokument. */
  active: boolean
  /** Stand in Prozent, 0–100. */
  percent: number
  /** Beschriftung für Hilfstechnik — fertig übersetzt. */
  label: string
}>()

/** Nie ganz bei null anfangen: Ein unsichtbarer Balken sieht aus wie keiner. */
const width = () => `${Math.max(2, Math.min(100, props.percent))}%`
</script>

<template>
  <div
    v-if="active"
    class="progressbar"
    role="progressbar"
    :aria-label="label"
    :aria-valuenow="percent"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div class="progressbar__fill" :style="{ width: width() }" />
  </div>
</template>

<style scoped lang="scss">
.progressbar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  /*
   * Über der Kopfzeile, die selbst klebt — sonst schöbe sich der Balken
   * darunter und wäre genau dort unsichtbar, wo er hingehört.
   */
  z-index: 3000;
  height: 2px;
  background-color: token(--accent, 0.15);

  &__fill {
    height: 100%;
    background-color: token(--accent);
    // Der Sprung von Papier zu Papier soll fließen, nicht hüpfen.
    transition: width 0.2s ease;
  }
}
</style>
