/**
 * Pinia-Store für Erreichbarkeit und Zustand der StockInfo-API.
 *
 * Die App hängt vollständig an dieser Gegenstelle: ohne sie keine Kurse und
 * damit keine einzige Kennzahl. Steht etwas nicht, soll man hier nachsehen
 * können, statt aus leeren Tabellen zu raten — deshalb auch die Adresse im
 * Klartext. Die stammt aus `VITE_STOCKINFO_API_URL` und wird beim Bauen
 * eingesetzt; im Container zeigt sie, welches Backend das Abbild wirklich
 * anspricht.
 *
 * Bewusst ein Store und kein Composable: Statuszeile und Einstellungen zeigen
 * denselben Zustand. Zwei Instanzen hätten getrennt geprüft und sich
 * widersprechen können.
 */

import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import { consola } from 'consola'
import { translate } from '@/i18n'
import { ApiError, describeFailure } from '@/api/errors'
import type { StockInfoClient } from '@/api/client'

export type ApiState = 'unknown' | 'checking' | 'online' | 'offline'

export const useApiStatusStore = defineStore('apiStatus', () => {
  const state = ref<ApiState>('unknown')
  const status = ref<string | null>(null)
  const version = ref<string | null>(null)
  const latencyMs = ref<number | null>(null)
  const checkedAt = ref<string | null>(null)

  /*
   * Das gerade laufende Versprechen — kein `ref`, weil es niemand anzeigt.
   * Es sorgt dafür, dass gleichzeitig startende Ansichten sich denselben
   * Health-Check teilen, statt je einen eigenen loszuschicken.
   */
  let laufenderCheck: Promise<void> | null = null
  const error = ref<string | null>(null)

  /**
   * Die Adresse, die nicht geantwortet hat — getrennt vom Satz darüber.
   *
   * Damit die Oberfläche sie anklickbar machen kann: Wer eine falsche Adresse
   * sieht, will sie ausprobieren, statt sie abzutippen. Aus dem fertigen Satz
   * ließe sie sich nur per Regex herausschneiden.
   */
  const errorUrl = ref<string | null>(null)

  /**
   * Fragt `/health` ab.
   *
   * @param client Der injizierte API-Client; `null`, wenn keiner bereitsteht.
   */
  async function check(client: StockInfoClient | null): Promise<void> {
    /*
     * Auch der ausdrückliche Aufruf trägt sich ein.
     *
     * Vorher tat das nur `ensureChecked`, und zwar für sein eigenes
     * Versprechen. Beim Start stößt aber `App.vue` den Check an, und die
     * Ansicht ruft kurz darauf `ensureChecked`: Der Zustand stand dann auf
     * `checking`, kein Versprechen war hinterlegt — also lief ein zweiter
     * Health-Check, der `error` und `errorUrl` des ersten zurücksetzte,
     * während dessen Anfrage noch unterwegs war.
     */
    laufenderCheck = fuehreCheckAus(client)
    try {
      await laufenderCheck
    } finally {
      laufenderCheck = null
    }
  }

  /** Der eigentliche Abruf — ohne Buchführung über laufende Prüfungen. */
  async function fuehreCheckAus(client: StockInfoClient | null): Promise<void> {
    if (!client) {
      state.value = 'offline'
      error.value = translate('notify.noClient')
      return
    }

    state.value = 'checking'
    error.value = null
    errorUrl.value = null
    const started = performance.now()

    try {
      const response = await client.health()
      latencyMs.value = Math.round(performance.now() - started)
      status.value = response.status
      version.value = response.version
      state.value = 'online'
      errorUrl.value = null
    } catch (cause) {
      latencyMs.value = Math.round(performance.now() - started)
      // Alte Werte verwerfen: Sonst stünde eine Version auf der Seite, die
      // gerade niemand bestätigt.
      status.value = null
      version.value = null
      state.value = 'offline'
      error.value = describeFailure(cause)
      errorUrl.value = cause instanceof ApiError ? cause.url : null
      consola.warn('status: Health-Check fehlgeschlagen', { reason: error.value })
    } finally {
      checkedAt.value = new Date().toISOString()
    }
  }

  /**
   * Läuft der Dienst? Fragt höchstens einmal und teilt die Antwort.
   *
   * Vorher liefen Health-Check und Kursabruf gleichzeitig los: Wenn die
   * Ansichten luden, wusste noch niemand, dass der Dienst tot ist — acht
   * Abrufe liefen in ihre Zeitüberschreitung, und hinterher meldete die App
   * „8 Kurse fehlen". Zwei Meldungen für eine Ursache, die vorher feststand.
   *
   * Das laufende Versprechen wird geteilt, damit gleichzeitig startende
   * Ansichten nicht je einen eigenen Check auslösen. Ein ausdrückliches
   * `check()` bleibt davon unberührt — wer nachsieht, will es wirklich wissen.
   *
   * @returns Der Zustand nach der Prüfung; wirft nie.
   */
  async function ensureChecked(
    client: StockInfoClient,
    maxAgeMinutes = Number.POSITIVE_INFINITY,
  ): Promise<ApiState> {
    // Läuft schon einer — gleich von wem angestoßen —, wird er abgewartet.
    if (laufenderCheck) {
      await laufenderCheck
      return state.value
    }

    if (befundGilt(maxAgeMinutes)) return state.value

    await check(client)
    return state.value
  }

  /**
   * Taugt der letzte Befund noch?
   *
   * Ohne Frist gilt er unbegrenzt — das ist der Startfall, in dem einmal
   * geprüft und das Ergebnis geteilt wird. Mit Frist altert er: Sonst bliebe
   * die App nach einem einzigen `offline` bis zum Sitzungsende dabei, auch
   * wenn der Dienst längst wieder antwortet. Seit der Health-Check aus der
   * Statuszeile heraus ist, prüft beim Ansichtswechsel sonst niemand mehr nach.
   */
  function befundGilt(maxAgeMinutes: number): boolean {
    if (state.value !== 'online' && state.value !== 'offline') return false
    if (!Number.isFinite(maxAgeMinutes)) return true
    if (maxAgeMinutes <= 0) return false

    const stand = checkedAt.value ? Date.parse(checkedAt.value) : Number.NaN
    if (Number.isNaN(stand)) return false
    return Date.now() - stand < maxAgeMinutes * 60_000
  }

  return { state, status, version, latencyMs, checkedAt, error, check, ensureChecked, errorUrl }
})

/*
 * Hot-Reload: Ohne diese Zeile behält der Browser beim Speichern die alte
 * Fassung des Stores. Neue Methoden fehlen dann — der Aufruf läuft ins Leere
 * und man sucht den Fehler im eigenen Code, obwohl nur ein Neuladen fehlt.
 */
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useApiStatusStore, import.meta.hot))
}
