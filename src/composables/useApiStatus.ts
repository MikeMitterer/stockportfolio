/**
 * Erreichbarkeit und Zustand der StockInfo-API.
 *
 * Die App hängt vollständig an dieser Gegenstelle: ohne sie keine Kurse und
 * damit keine einzige Kennzahl. Steht etwas nicht, soll man hier nachsehen
 * können, statt aus leeren Tabellen zu raten — deshalb auch die Adresse im
 * Klartext. Die stammt aus `VITE_STOCKINFO_API_URL` und wird beim Bauen
 * eingesetzt; im Container zeigt sie, welches Backend das Abbild wirklich
 * anspricht.
 */

import { ref, type Ref } from 'vue'
import { consola } from 'consola'
import { ApiError } from '@/api/errors'
import type { StockInfoClient } from '@/api/client'

export type ApiState = 'unknown' | 'checking' | 'online' | 'offline'

export interface ApiStatus {
  state: Ref<ApiState>
  /** Meldung der Gegenstelle, z.B. `ok`. */
  status: Ref<string | null>
  version: Ref<string | null>
  /** Dauer der letzten Anfrage in Millisekunden. */
  latencyMs: Ref<number | null>
  /** Zeitpunkt der letzten Prüfung als ISO-String. */
  checkedAt: Ref<string | null>
  error: Ref<string | null>
  check: () => Promise<void>
}

/**
 * @param client Der injizierte API-Client; `null`, wenn keiner bereitsteht.
 */
export function useApiStatus(client: StockInfoClient | null): ApiStatus {
  const state = ref<ApiState>('unknown')
  const status = ref<string | null>(null)
  const version = ref<string | null>(null)
  const latencyMs = ref<number | null>(null)
  const checkedAt = ref<string | null>(null)
  const error = ref<string | null>(null)

  async function check(): Promise<void> {
    if (!client) {
      state.value = 'offline'
      error.value = 'Kein API-Client verfügbar'
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
      status.value = null
      version.value = null
      state.value = 'offline'
      // Der Grund gehört sichtbar auf die Seite: „offline" allein sagt nicht,
      // ob die Adresse falsch ist, das Netz fehlt oder der Dienst streikt.
      error.value =
        cause instanceof ApiError
          // Status 0 heißt: keine Antwort — Netz, Adresse oder CORS.
          ? cause.status === 0
            ? `${cause.detail} — keine Antwort von ${cause.url}`
            : `${cause.detail} (HTTP ${cause.status})`
          : cause instanceof Error
            ? cause.message
            : 'Unbekannter Fehler'
      consola.warn('status: Health-Check fehlgeschlagen', { reason: error.value })
    } finally {
      checkedAt.value = new Date().toISOString()
    }
  }

  return { state, status, version, latencyMs, checkedAt, error, check }
}
