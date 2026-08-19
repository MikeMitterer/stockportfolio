/**
 * Fehler-Typen des API-Layers.
 *
 * Der Client wirft ausschließlich `ApiError` — Aufrufer müssen weder
 * `Response`-Objekte noch rohe `fetch`-Exceptions kennen.
 */

import { translate } from '@/i18n'

/**
 * Woher die Basis-Adresse stammt, gegen die eine Anfrage lief.
 *
 * Drei Fälle, weil zwei nicht reichen: Im Container schreibt der Entrypoint
 * `config.js` auch dann, wenn `STOCKINFO_API_URL` fehlt — die App fällt dann
 * auf den Build-Wert zurück, aber eine `.env` gibt es dort nicht. Wer sie
 * ändern will, setzt die Container-Variable.
 *
 * `runtime` — `STOCKINFO_API_URL` am Container, über `config.js` gereicht.
 * `container-build` — im Container, aber ohne gesetzte Variable.
 * `build` — `VITE_STOCKINFO_API_URL` aus der `.env`, beim Bauen eingesetzt.
 */
export type ApiUrlSource = 'runtime' | 'container-build' | 'build'

/** HTTP- oder Netzwerkfehler beim Ansprechen der StockInfo-API. */
export class ApiError extends Error {
  /**
   * @param status HTTP-Statuscode; `0` bei Netzwerk-/CORS-Fehlern (keine Antwort).
   * @param detail Fehlerdetail der API (`detail`-Feld) oder Fallback-Text.
   * @param url    Angefragte URL — für Logging und Debugging.
   * @param urlSource Woher die Basis-Adresse kam. Der Client weiß das beim
   *   Werfen; später ließe es sich nur noch raten. Ohne die Angabe nennt eine
   *   Fehlermeldung zwar die falsche Adresse, aber nicht, wo man sie ändert.
   */
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly url: string,
    readonly urlSource?: ApiUrlSource,
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
 * „Netzwerkfehler" allein lässt offen, ob die Adresse falsch ist, das Netz
 * fehlt oder der Dienst streikt. Bei ausbleibender Antwort (Status 0) steht
 * deshalb die angefragte Adresse dabei — dort liegt die Ursache meist, etwa
 * eine falsche `VITE_STOCKINFO_API_URL`. Hat der Dienst dagegen geantwortet,
 * hilft die Adresse nicht weiter; dann zählt sein Statuscode.
 *
 * Stand einmal nur im Status-Store und war damit ausgerechnet dort nicht zu
 * haben, wo ein Nutzer den Fehler zuerst sieht: bei den Papieren.
 *
 * @param cause Der aufgetretene Fehler.
 */
export function describeFailure(cause: unknown): string {
  if (cause instanceof ApiError) {
    if (!cause.isNetworkError) return `${cause.detail} (HTTP ${cause.status})`
    // Herkunft nur bei ausbleibender Antwort: Hat der Dienst geantwortet,
    // stimmt die Adresse, und der Hinweis führte in die Irre.
    const herkunft = cause.urlSource ? ` · ${translate(`errors.urlFrom.${cause.urlSource}`)}` : ''
    return `${cause.detail} — keine Antwort von ${cause.url}${herkunft}`
  }
  return cause instanceof Error ? cause.message : String(cause)
}
