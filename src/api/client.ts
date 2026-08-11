/**
 * HTTP-Client für die StockInfo-API.
 *
 * Einzige Stelle im Projekt, die `fetch` kennt. Die Base-URL wird injiziert
 * (kein globaler Zugriff auf `import.meta.env`), damit der Client in Tests
 * ohne Netzwerk instanziierbar bleibt.
 */

import { ApiError } from './errors'
import type {
  DailyPoint,
  HealthResponse,
  InstrumentSummary,
  Period,
  QuotePoint,
  QuoteResponse,
} from './types'

/** Injizierbare fetch-Implementierung — erlaubt Mocking in Tests. */
export type FetchFn = typeof globalThis.fetch

export class StockInfoClient {
  private readonly baseUrl: string
  private readonly fetchFn: FetchFn

  /**
   * @param baseUrl Basis-URL ohne trailing slash, z.B. `https://stockinfo.int.mikemitterer.at`.
   * @param fetchFn Optionale fetch-Implementierung (Default: globales `fetch`).
   */
  constructor(baseUrl: string, fetchFn: FetchFn = globalThis.fetch.bind(globalThis)) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.fetchFn = fetchFn
  }

  /** Die konfigurierte Basis-URL — für die Status-Anzeige. */
  get url(): string {
    return this.baseUrl
  }

  /** Katalog aller bekannten Instrumente. */
  async getInstruments(): Promise<InstrumentSummary[]> {
    return this.request<InstrumentSummary[]>('/instruments')
  }

  /** Kurs zu einer ISIN (bevorzugt Xetra/EUR). */
  async getQuoteByIsin(isin: string): Promise<QuoteResponse> {
    return this.request<QuoteResponse>(`/quote/${encodeURIComponent(isin)}`)
  }

  /** Kurs zu einem vollständigen Yahoo-Symbol inkl. Suffix, z.B. `VGWL.DE`. */
  async getQuoteBySymbol(symbol: string): Promise<QuoteResponse> {
    return this.request<QuoteResponse>(`/quote?symbol=${encodeURIComponent(symbol)}`)
  }

  /** Tages-Schlusskurse (EOD) zu einer ISIN. */
  async getDailyHistory(isin: string, period: Period = '3m'): Promise<DailyPoint[]> {
    return this.request<DailyPoint[]>(
      `/quote/${encodeURIComponent(isin)}/daily?period=${period}`,
    )
  }

  /**
   * Tagesschlusskurse zu einem Symbol.
   *
   * Nötig für Positionen ohne ISIN — Cash hat keine, und selbst gepflegte
   * Papiere manchmal auch nicht.
   */
  async getDailyHistoryBySymbol(symbol: string, period: Period = '3m'): Promise<DailyPoint[]> {
    return this.request<DailyPoint[]>(
      `/quote/by-symbol/${encodeURIComponent(symbol)}/daily?period=${period}`,
    )
  }

  /** Intraday-Kurshistorie zu einer ISIN. */
  async getQuoteHistory(isin: string, limit = 100): Promise<QuotePoint[]> {
    return this.request<QuotePoint[]>(
      `/quote/${encodeURIComponent(isin)}/history?limit=${limit}`,
    )
  }

  /** Erzwingt serverseitiges Neuladen eines Papiers. */
  async refreshByIsin(isin: string): Promise<QuoteResponse> {
    return this.request<QuoteResponse>(`/refresh/${encodeURIComponent(isin)}`, 'POST')
  }

  /** Health-Check der API. */
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health')
  }

  /**
   * Führt eine Anfrage aus und wirft `ApiError` bei jedem Fehlerfall.
   *
   * @param path   Pfad inkl. führendem Slash und Query-String.
   * @param method HTTP-Methode (Default `GET`).
   * @returns Deserialisierter Response-Body.
   * @throws {ApiError} Bei Netzwerkfehler (`status: 0`) oder HTTP-Status >= 400.
   */
  private async request<T>(path: string, method: 'GET' | 'POST' = 'GET'): Promise<T> {
    const url = `${this.baseUrl}${path}`

    let response: Response
    try {
      response = await this.fetchFn(url, {
        method,
        headers: { Accept: 'application/json' },
      })
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : 'Netzwerkfehler'
      throw new ApiError(0, detail, url)
    }

    if (!response.ok) {
      throw new ApiError(response.status, await readErrorDetail(response), url)
    }

    return (await response.json()) as T
  }
}

/**
 * Liest das `detail`-Feld einer FastAPI-Fehlerantwort.
 * Fällt auf den HTTP-Statustext zurück, wenn der Body nicht lesbar ist.
 */
async function readErrorDetail(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && 'detail' in body) {
      const detail = (body as { detail: unknown }).detail
      if (typeof detail === 'string') return detail
      return JSON.stringify(detail)
    }
  } catch {
    // Body war kein JSON — Statustext genügt.
  }
  return response.statusText || 'Unbekannter Fehler'
}

/**
 * Zur Laufzeit eingespielte Konfiguration.
 *
 * Wird im Container vom Entrypoint nach `config.js` geschrieben; im Betrieb
 * ohne Container liefert die Datei aus `public/` einen leeren Wert.
 */
declare global {
  interface Window {
    __STOCKPORTFOLIO_CONFIG__?: { apiUrl?: string }
  }
}

/**
 * Base-URL der API.
 *
 * Drei Quellen, in dieser Reihenfolge:
 *
 * 1. `config.js` — vom Container-Entrypoint aus `STOCKINFO_API_URL` erzeugt.
 *    Ohne diesen Schritt wäre die Adresse ins Bündel gebacken und dasselbe
 *    Abbild ließe sich nicht auf ein anderes Backend richten; für jede
 *    Umgebung bräuchte es einen eigenen Build.
 * 2. `VITE_STOCKINFO_API_URL` aus dem `.env` — der Wert zur Bauzeit, damit
 *    Entwicklung und Vorschau ohne Container auskommen.
 * 3. Die Produktions-Instanz als letzte Rückfallebene.
 */
export function apiBaseUrl(): string {
  const runtime = globalThis.window?.__STOCKPORTFOLIO_CONFIG__?.apiUrl
  if (runtime) return runtime
  return import.meta.env.VITE_STOCKINFO_API_URL || 'https://stockinfo.int.mikemitterer.at'
}

/** Injection-Key für den Client (Vue provide/inject). */
export const STOCK_INFO_CLIENT = Symbol('stockInfoClient')
