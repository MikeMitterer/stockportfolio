/**
 * Fehler-Typen des API-Layers.
 *
 * Der Client wirft ausschließlich `ApiError` — Aufrufer müssen weder
 * `Response`-Objekte noch rohe `fetch`-Exceptions kennen.
 */

/** HTTP- oder Netzwerkfehler beim Ansprechen der StockInfo-API. */
export class ApiError extends Error {
  /**
   * @param status HTTP-Statuscode; `0` bei Netzwerk-/CORS-Fehlern (keine Antwort).
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
