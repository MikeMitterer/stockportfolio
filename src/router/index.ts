import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
  },
  {
    path: '/rebalancing',
    name: 'rebalancing',
    component: () => import('@/views/RebalancingView.vue'),
  },
  {
    path: '/assets',
    name: 'instruments',
    component: () => import('@/views/InstrumentsView.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
  },
  {
    /*
     * Die Methodenseite steht bewusst nicht in der Hauptnavigation: Wer die
     * App öffnet, will sie ausprobieren, nicht lesen. Erreichbar ist sie über
     * die Fragezeichen an den Begriffen — also dann, wenn jemand eine Frage
     * hat.
     */
    path: '/method',
    name: 'method',
    component: () => import('@/views/MethodView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'dashboard' },
  },
]

export const router = createRouter({
  /*
   * Hash-Modus, nicht History.
   *
   * Im History-Modus sind /rebalancing und /settings echte Adressen: Der erste
   * Aufruf geht an den Server, der dort keine Datei findet — jeder Reload auf
   * einer Unterseite endete im 404, sofern der Server nicht auf die index.html
   * zurückfällt. Das erzwang eine Server-Konfiguration.
   *
   * Mit dem Hash sieht der Server immer nur „/". Die Anwendung läuft damit
   * unter jedem beliebigen Dateiserver, ohne dass dieser etwas von ihr wissen
   * muss. Preis dafür sind die Adressen: /#/rebalancing statt /rebalancing.
   */
  history: createWebHashHistory(),
  routes,

  /**
   * Sprungmarken anfahren, sonst oben beginnen.
   *
   * Ohne das landet jeder Verweis auf einen Abschnitt der Methodenseite am
   * Seitenanfang — der Nutzer müsste selbst suchen, was er angeklickt hat.
   */
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})
