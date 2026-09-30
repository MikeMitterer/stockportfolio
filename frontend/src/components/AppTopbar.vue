<script setup lang="ts">
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { UxNavItem, UxTopbar, type NavIconName } from '@mmit/ux-foundation'
import { AUTH_LOGOUT, AUTH_USER } from '@/auth/context'

defineProps<{
  lastRefreshLabel?: string
  /** Solange die Kurse geholt werden — der Knopf dreht und nimmt keinen zweiten Klick an. */
  refreshing?: boolean
}>()

const emit = defineEmits<{
  (event: 'refresh'): void
}>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const logout = inject(AUTH_LOGOUT)
const authenticatedUser = inject(AUTH_USER)
const isAdmin = computed(() => authenticatedUser?.value?.role === 'admin')
const accountOptions = computed(() => [{ label: t('auth.logout'), key: 'logout' }])

function selectAccountOption(key: string): void {
  if (key === 'logout') void logout?.()
}

/** Verweis auf die Startansicht — UxTopbar erwartet eine Adresse, kein Ziel-Objekt. */
const dashboardHref = computed(() => router.resolve({ name: 'dashboard' }).href)

/*
 * Die gemeinsamen Navigationssymbole stehen im Fundament. Das Personen-Icon
 * für die hiesige Kontoverwaltung bleibt direkt am app-spezifischen Link.
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
      <!--
        `UxNavItem` aus dem Fundament: Beschriftung ab `md`, verstecktes Label
        für Hilfstechnik und der Unterstrich am aktiven Punkt stecken darin.
        Hier lagen dieselben Regeln vorher als eigene siebzig Zeilen.

        Die Adresse kommt aus dem Router, damit Mittelklick und „in neuem Tab
        öffnen" funktionieren; der Klick selbst geht über `router.push`, sonst
        lüde die Seite neu.
      -->
      <UxNavItem
        v-for="item in navItems"
        :key="item.name"
        :class="{ 'topbar__rebalancing': item.name === 'rebalancing' }"
        :icon="item.icon"
        :label="item.label"
        :active="isActive(item.name)"
        :href="router.resolve({ name: item.name }).href"
        @select="router.push({ name: item.name })"
      />
      <RouterLink
        v-if="isAdmin"
        class="topbar__admin"
        :class="{ 'topbar__admin--active': isActive('admin-users') }"
        :to="{ name: 'admin-users' }"
        :aria-label="t('nav.users')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5" />
        </svg>
        <span>{{ t('nav.users') }}</span>
      </RouterLink>
    </template>

    <template #actions>
      <span v-if="lastRefreshLabel" class="topbar__age tabular-nums">
        {{ lastRefreshLabel }}
      </span>

      <!--
        `loading` ersetzt das Symbol durch den Spinner und lässt die
        Beschriftung stehen — unterhalb `md` fällt die ohnehin weg, dann dreht
        an derselben Stelle der Pfeil. `disabled` dazu, sonst lässt sich
        derselbe Abruf mehrfach anstoßen.
      -->
      <NButton
        size="small"
        secondary
        :loading="refreshing"
        :disabled="refreshing"
        @click="emit('refresh')"
      >
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
      <NDropdown trigger="click" :options="accountOptions" @select="selectAccountOption">
        <NButton size="small" secondary :aria-label="t('auth.accountMenu', { username: authenticatedUser?.username ?? '' })">
          <template #icon>
            <NIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="3" />
                <path d="M5 20a7 7 0 0 1 14 0" />
              </svg>
            </NIcon>
          </template>
          {{ authenticatedUser?.username ?? '' }}
        </NButton>
      </NDropdown>
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



/*
 * Ein Strich, kein Kasten: Eine eingefärbte Fläche hinter dem aktiven Punkt
 * konkurriert mit den Karten darunter.
 */

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

// Mobil bleibt der Rebalancing-Einstieg als Wort erreichbar; das Symbol entfällt.
.topbar__rebalancing {
  @include below(md) {
    :deep(svg) { display: none; }
    :deep(.ux-navitem__label) { display: inline; }
  }
}

/* Die Kontoverwaltung gehört nur zu dieser App und führt direkt zur Liste. */
.topbar__admin {
  position: relative;
  @include row(0.375rem);
  padding: 0.375rem var(--space-3);
  border-radius: var(--radius-sm);
  color: token(--text-bar-secondary);
  font-size: var(--font-sm);
  text-decoration: none;
  svg { width: 1rem; height: 1rem; }
  &:hover { background: token(--surface-bar-raised, 0.12); color: token(--text-bar); }
  &--active { color: token(--text-bar); }
  &--active::after {
    position: absolute;
    right: var(--space-2);
    bottom: -4px;
    left: var(--space-2);
    height: 2px;
    border-radius: var(--radius-full);
    background: token(--accent);
    content: '';
  }
  @include below(md) { span { display: none; } }
}
</style>
