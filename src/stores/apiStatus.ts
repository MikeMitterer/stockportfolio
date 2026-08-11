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
import { ApiError } from '@/api/errors'
import type { StockInfoClient } from '@/api/client'

export type ApiState = 'unknown' | 'checking' | 'online' | 'offline'

/**
 * Übersetzt einen Fehler in einen Satz, der weiterhilft.
 *
 * „nicht erreichbar" allein sagt nicht, ob die Adresse falsch ist, das Netz
 * fehlt oder der Dienst streikt. Bei ausbleibender Antwort (Status 0) steht
 * deshalb die angefragte Adresse dabei — dort liegt die Ursache meist.
 *
 * @param cause Der aufgetretene Fehler.
 */
function describeFailure(cause: unknown): string {
  if (cause instanceof ApiError) {
    return cause.status === 0
      ? `${cause.detail} — keine Antwort von ${cause.url}`
      : `${cause.detail} (HTTP ${cause.status})`
  }
  return cause instanceof Error ? cause.message : translate('notify.unknownError')
}

export const useApiStatusStore = defineStore('apiStatus', () => {
  const state = ref<ApiState>('unknown')
  const status = ref<string | null>(null)
  const version = ref<string | null>(null)
  const latencyMs = ref<number | null>(null)
  const checkedAt = ref<string | null>(null)
  const error = ref<string | null>(null)

  /**
   * Fragt `/health` ab.
   *
   * @param client Der injizierte API-Client; `null`, wenn keiner bereitsteht.
   */
  async function check(client: StockInfoClient | null): Promise<void> {
    if (!client) {
      state.value = 'offline'
      error.value = translate('notify.noClient')
      return
    }

    state.value = 'checking'
    error.value = null
    const started = performance.now()

    try {
      const response = await client.health()
      latencyMs.value = Math.round(performance.now() - started)
      status.value = response.status
      version.value = response.version
      state.value = 'online'
    } catch (cause) {
      latencyMs.value = Math.round(performance.now() - started)
      // Alte Werte verwerfen: Sonst stünde eine Version auf der Seite, die
      // gerade niemand bestätigt.
      status.value = null
      version.value = null
      state.value = 'offline'
      error.value = describeFailure(cause)
      consola.warn('status: Health-Check fehlgeschlagen', { reason: error.value })
    } finally {
      checkedAt.value = new Date().toISOString()
    }
  }

  return { state, status, version, latencyMs, checkedAt, error, check }
})

/*
 * Hot-Reload: Ohne diese Zeile behält der Browser beim Speichern die alte
 * Fassung des Stores. Neue Methoden fehlen dann — der Aufruf läuft ins Leere
 * und man sucht den Fehler im eigenen Code, obwohl nur ein Neuladen fehlt.
 */
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useApiStatusStore, import.meta.hot))
}
