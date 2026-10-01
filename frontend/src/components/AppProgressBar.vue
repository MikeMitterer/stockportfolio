<script setup lang="ts">
/**
 * Schmale Fortschrittsleiste am oberen Seitenrand.
 *
 * Zeigt Kursabrufe und Depotabgleiche, ohne das Seitenlayout zu verschieben.
 * Bei Depotabgleichen gibt es keinen messbaren Prozentwert.
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
  /** Stand in Prozent, 0–100; null bei einem Abruf ohne messbaren Fortschritt. */
  percent: number | null
  /** Beschriftung für Hilfstechnik — fertig übersetzt. */
  label: string
}>()

/** Nie ganz bei null anfangen: Ein unsichtbarer Balken sieht aus wie keiner. */
const width = () => props.percent === null ? undefined : `${Math.max(2, Math.min(100, props.percent))}%`
</script>

<template>
  <div
    v-if="active"
    class="progressbar"
    :class="{ 'progressbar--indeterminate': percent === null }"
    role="progressbar"
    :aria-label="label"
    :aria-valuenow="percent ?? undefined"
    :aria-valuemin="percent === null ? undefined : 0"
    :aria-valuemax="percent === null ? undefined : 100"
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
  height: 4px;
  background-color: token(--accent, 0.15);

  &__fill {
    height: 100%;
    background-color: token(--accent);
    // Der Sprung von Papier zu Papier soll fließen, nicht hüpfen.
    transition: width 0.2s ease;
  }

  &--indeterminate &__fill {
    width: 30%;
    animation: progressbar-scan 1.3s ease-in-out infinite alternate;
  }
}

@keyframes progressbar-scan {
  from { transform: translateX(0); }
  to { transform: translateX(233%); }
}

@media (prefers-reduced-motion: reduce) {
  .progressbar--indeterminate .progressbar__fill { animation: none; }
}
</style>
