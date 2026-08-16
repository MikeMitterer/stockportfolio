<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon } from 'naive-ui'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { UxIcon, UxTopbar, type NavIconName } from '@mikemitterer/ux-foundation'

defineProps<{
  lastRefreshLabel?: string
}>()

const emit = defineEmits<{
  (event: 'refresh'): void
}>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

/** Verweis auf die Startansicht — UxTopbar erwartet eine Adresse, kein Ziel-Objekt. */
const dashboardHref = computed(() => router.resolve({ name: 'dashboard' }).href)

/*
 * Die Symbole stehen im Fundament, nicht hier. Sie sind über alle Apps
 * dieselben — das ist der Punkt, an dem eine Sammlung zusammenwächst oder
 * auseinanderfällt.
 */
const navItems = computed<{ name: string; label: string; icon: NavIconName }[]>(() => [
  { name: 'dashboard', label: t('nav.dashboard'), icon: 'dashboard' },
  { name: 'rebalancing', label: t('nav.rebalancing'), icon: 'rebalancing' },
  { name: 'instruments', label: t('nav.instruments'), icon: 'instruments' },
  { name: 'settings', label: t('nav.settings'), icon: 'settings' },
])

const isActive = (name: string): boolean => route.name === name
</script>

<template>
  <!--
    Rahmen, Plakette und Wortmarke kommen aus dem Fundament. Hier bleibt, was
    diese App ausmacht: welches Zeichen in der Plakette steht, welche
    Menüpunkte es gibt und was rechts angezeigt wird.
  -->
  <UxTopbar
    :brand-lead="t('app.brandLead')"
    :brand-accent="t('app.brandAccent')"
    :href="dashboardHref"
  >
    <template #badge>
      <!--
        Ring aus zwei Segmenten: ein Bestand und seine Aufteilung. Dieselbe
        Form wie in public/favicon.svg, dort nur mit der Kachel darunter — hier
        trägt die das Fundament. Stumpfe Strichenden, sonst fressen die
        Rundungen die beiden Lücken auf.

        pathLength="100" setzt den Umfang auf hundert Einheiten, damit die
        Längen unten Prozente sind: Browser nähern den Bogen unterschiedlich an
        (gemessen 56,18 statt 56,55), und ohne das stößt das Muster am
        Startpunkt nicht sauber zusammen.
      -->
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgb(var(--brand-contrast))"
        stroke-width="3.4"
        width="16"
        height="16"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          pathLength="100"
          stroke-dasharray="60 7.6 24.8 7.6"
          transform="rotate(-90 12 12)"
        />
      </svg>
    </template>

    <template #nav>
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="{ name: item.name }"
        class="topbar__item"
        :class="{ 'topbar__item--active': isActive(item.name) }"
      >
        <UxIcon :name="item.icon" />
        <!--
            Unterhalb md fällt die Beschriftung weg, nicht der Punkt: Vier
            Symbole passen auf jedes Telefon, ein Hamburger kostete einen
            zusätzlichen Griff.
          -->
        <span class="topbar__label">{{ item.label }}</span>
        <span class="visually-hidden">{{ item.label }}</span>
        <!-- Aktiver Eintrag: Unterstrich in Akzentfarbe, wie im Backend -->
        <span v-if="isActive(item.name)" class="topbar__underline"></span>
      </RouterLink>
    </template>

    <template #actions>
      <span v-if="lastRefreshLabel" class="topbar__age tabular-nums">
        {{ lastRefreshLabel }}
      </span>

      <NButton size="small" secondary @click="emit('refresh')">
        <template #icon>
          <NIcon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6" />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M20 10a8 8 0 0 0-14-4M4 14a8 8 0 0 0 14 4"
              />
            </svg>
          </NIcon>
        </template>
        <span class="topbar__refresh-label">{{ t('actions.refresh') }}</span>
      </NButton>
    </template>
  </UxTopbar>
</template>

<style scoped lang="scss">
/*
 * Rahmen, Plakette und Wortmarke stehen im Fundament (`UxTopbar`). Hier bleibt
 * nur, was diese App eigen macht — die Menüpunkte und die rechte Gruppe.
 *
 * Nicht mehr unter `.topbar` verschachtelt: Dieses Element gibt es nicht mehr,
 * die Klassen hängen jetzt an Inhalten, die als Slot in die Fremdkomponente
 * wandern. Verschachtelt griffe keine einzige Regel.
 */

.topbar__item {
  position: relative;
  @include row(0.375rem);
  padding: 0.375rem var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  color: token(--text-bar-secondary);
  transition: color 0.15s ease, background-color 0.15s ease;

  &:hover {
    background-color: token(--surface-raised);
    color: token(--text-bar);
  }

  &--active {
    color: token(--text-bar);
  }
}

.topbar__label {
  display: none;

  @include up(md) { display: inline; }
}

/*
 * Ein Strich, kein Kasten: Eine eingefärbte Fläche hinter dem aktiven Punkt
 * konkurriert mit den Karten darunter.
 */
.topbar__underline {
  position: absolute;
  right: var(--space-2);
  bottom: -9px;
  left: var(--space-2);
  height: 2px;
  border-radius: var(--radius-full);
  background-color: token(--accent);
}

/*
 * Erst ab `lg`: Bei Tablet-Breite drängen die vier Beschriftungen und der
 * Knopf das Alter auf 40 Pixel zusammen, es brach dann dreizeilig um.
 * Verloren geht nichts — dieselbe Angabe steht in der Statuszeile.
 */
.topbar__age {
  display: none;
  font-size: var(--font-xs);
  white-space: nowrap;
  color: token(--text-bar-muted);

  @include up(lg) { display: inline; }
}

/*
 * Erst ab `lg`: Bei Tablet-Breite schob die Beschriftung den Knopf über den
 * rechten Rand.
 */
.topbar__refresh-label {
  display: none;

  @include up(lg) { display: inline; }
}
</style>
