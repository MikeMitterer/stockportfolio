/**
 * Fehler-Typen des API-Layers.
 *
 * Der Client wirft ausschließlich `ApiError` — Aufrufer müssen weder
 * `Response`-Objekte noch rohe `fetch`-Exceptions kennen.
 */

import { translate } from '@/i18n'

/** HTTP- oder Netzwerkfehler beim Ansprechen der StockInfo-API. */
export class ApiError extends Error {
  /**
   * @param status HTTP-Statuscode; `0`, wenn der eigene Server nicht antwortet.
   * @param detail Fehlerdetail der API (`detail`-Feld) oder Fallback-Text.
   * @param url    Angefragte URL — für Logging und Debugging.
   */
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly url: string,
  ) {
    super(`[${status}] ${detail} (${url})`)
    this.name = 'ApiError'
  }

  /** True wenn die Anfrage den Server gar nicht erreicht hat. */
  get isNetworkError(): boolean {
    return this.status === 0
  }

  /** True wenn die Ressource nicht existiert (z.B. unbekannte ISIN). */
  get isNotFound(): boolean {
    return this.status === 404
  }
}

/**
 * Der Satz, den ein Fehler über sich selbst sagen kann.
 *
 * „Netzwerkfehler" allein lässt offen, ob das Netz fehlt oder der Dienst
 * streikt. Bei ausbleibender Antwort (Status 0) steht deshalb die angefragte
 * Adresse dabei; seit T-82 ist das immer der eigene Server. Ist StockInfo
 * hinter ihm nicht erreichbar, antwortet der Server selbst mit einem Status
 * und einer lesbaren Meldung; dann zählt diese.
 *
 * Stand einmal nur im Status-Store und war damit ausgerechnet dort nicht zu
 * haben, wo ein Nutzer den Fehler zuerst sieht: bei den Papieren.
 *
 * @param cause Der aufgetretene Fehler.
 */
export function describeFailure(cause: unknown): string {
  if (cause instanceof ApiError) {
    if (!cause.isNetworkError) return `${cause.detail} (HTTP ${cause.status})`
    return `${cause.detail} — keine Antwort von ${cause.url}`
  }
  // Kein `String(cause)`: Was kein `Error` ist, ergäbe wörtlich „undefined",
  // „null" oder „[object Object]" — und das stünde so auf der Statusseite und
  // im Dialog.
  return cause instanceof Error ? cause.message : translate('notify.unknownError')
}
