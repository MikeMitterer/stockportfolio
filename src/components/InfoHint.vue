<script setup lang="ts">
import { NTooltip } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

/**
 * Fragezeichen mit Kurzerklärung — für Begriffe, die nicht selbsterklärend sind.
 *
 * Erklärung dort, wo die Frage entsteht: Wer „Investitionsreserve" liest und
 * stutzt, sucht keine Hilfeseite, sondern will es an Ort und Stelle wissen.
 * Deshalb zwei, drei Sätze im Tooltip statt eines Verweises.
 *
 * Wer mehr will, kommt über „Mehr dazu" auf die Methodenseite. Die steht
 * bewusst nicht in der Hauptnavigation — sie ist zum Nachschlagen da, nicht
 * zum Durcharbeiten.
 */
const props = defineProps<{
  /** Bereits übersetzter Erklärungstext. */
  text: string
  /** Sprungmarke auf der Methodenseite; ohne sie erscheint kein Verweis. */
  anchor?: string
  /**
   * Reiter in den Einstellungen, in dem der zugehörige Wert steht.
   *
   * Erklärung und Stellschraube gehören zusammen: Wer liest, was der
   * Sicherheitspuffer ist, will ihn im nächsten Moment ändern — und sucht
   * sonst selbst, in welchem Reiter er steckt.
   */
  settingsTab?: string
}>()

const { t } = useI18n()
const router = useRouter()

function openMethod(): void {
  void router.push({ path: '/method', hash: props.anchor ? `#${props.anchor}` : '' })
}

function openSetting(): void {
  void router.push({ path: '/settings', query: { tab: props.settingsTab } })
}
</script>

<template>
  <!--
    `keep-alive-on-hover` ist entscheidend: Ohne das verschwindet der Tooltip,
    sobald die Maus ihn erreicht — und „Mehr dazu" wäre nicht anklickbar.
  -->
  <NTooltip trigger="hover" keep-alive-on-hover :style="{ maxWidth: '22rem' }">
    <template #trigger>
      <!--
        Klein und blass: Der Hinweis darf die Zahl daneben nicht überstrahlen.
        Als Knopf, nicht als Symbol — er ist mit der Tastatur erreichbar und
        führt bei Klick weiter.
      -->
      <button class="hint__trigger" type="button" :aria-label="text" @click="openMethod">?</button>
    </template>

    <div class="hint__body">
      {{ text }}
      <!--
        Beide Verweise in einer Zeile: Erklärung links, Stellschraube rechts.
        Untereinander sah es nach einer Liste aus, obwohl es zwei
        gleichrangige Wege sind.

        Echte Knöpfe, kein Text, der wie einer aussieht. Vorher stand hier ein
        `span` — er sah aus wie ein Verweis, war aber keiner, und ein Klick
        darauf tat nichts.
      -->
      <div v-if="anchor || settingsTab" class="hint__links">
        <button v-if="anchor" class="hint__link" type="button" @click="openMethod">
          {{ t('method.more') }}
        </button>

        <button v-if="settingsTab" class="hint__link" type="button" @click="openSetting">
          {{ t('method.openSetting') }}
        </button>
      </div>
    </div>
  </NTooltip>
</template>

<style scoped lang="scss">
/*
 * Klein und blass: Der Hinweis darf die Zahl daneben nicht überstrahlen.
 * Als Knopf, nicht als Symbol — er ist mit der Tastatur erreichbar und führt
 * bei Klick weiter.
 */
.hint__trigger {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 0.875rem;
  height: 0.875rem;
  border: 1px solid token(--border-default);
  border-radius: var(--radius-full);
  font-size: 0.5625rem;
  line-height: 1;
  vertical-align: middle;
  color: token(--text-muted);
  transition: color 0.15s ease, border-color 0.15s ease;

  &:hover {
    border-color: token(--text-muted);
    color: token(--text-secondary);
  }
}

.hint__body {
  font-size: var(--font-sm);
  line-height: 1.625;
}

.hint__links {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
  margin-top: var(--space-1);
  font-size: var(--font-xs);
}

.hint__link {
  color: token(--accent);
  text-decoration: underline dotted;

  &:hover { opacity: 0.8; }
}
</style>
