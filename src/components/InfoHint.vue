<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { UxInfoHint } from '@mmit/ux-foundation'

/**
 * Fragezeichen mit Kurzerklärung — die App-Hälfte davon.
 *
 * Aussehen und Verhalten liefert `UxInfoHint` aus dem Fundament; StockInfo
 * brauchte dieselbe Sache, also ist sie dorthin gezogen, statt ein zweites Mal
 * zu entstehen. Hier bleibt, was das Paket nicht wissen kann: wie die Verweise
 * heißen (Katalog) und wohin sie führen (Router).
 *
 * Die Aufrufstellen sprechen weiter in den Begriffen der App — `anchor` für die
 * Sprungmarke auf der Methodenseite, `settingsTab` für den Reiter.
 */
const props = defineProps<{
  /** Bereits übersetzter Erklärungstext. */
  text: string
  /** Sprungmarke auf der Methodenseite; ohne sie erscheint kein „Mehr dazu". */
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

/*
 * Adressen statt Router-Aufrufen: Der Hinweis baut daraus echte Verweise, damit
 * Mittelklick und „in neuem Tab öffnen" funktionieren. `resolve` übersetzt die
 * Route in die Hash-Schreibweise — die kennt der Router, nicht diese Datei.
 */
const moreHref = computed(
  () => router.resolve({ path: '/method', hash: props.anchor ? `#${props.anchor}` : '' }).href,
)

const settingHref = computed(() =>
  props.settingsTab
    ? router.resolve({ path: '/settings', query: { tab: props.settingsTab } }).href
    : undefined,
)

/*
 * Ohne Sprungmarke bleibt der Verweis weg, das „?" führt aber weiterhin auf die
 * Methodenseite — ein Verweis „Mehr dazu" ohne Ziel im Text wäre eine leere
 * Zusage.
 */
const moreLabel = computed(() => (props.anchor ? t('method.more') : undefined))
</script>

<template>
  <UxInfoHint
    :text="text"
    :more-href="moreHref"
    :more-label="moreLabel"
    :setting-href="settingHref"
    :setting-label="settingsTab ? t('method.openSetting') : undefined"
  />
</template>
