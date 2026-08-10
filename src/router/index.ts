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
})
