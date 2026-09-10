/**
 * HTTP-Client für die StockInfo-API.
 *
 * Einzige Stelle im Projekt, die `fetch` kennt. Die Base-URL wird injiziert
 * (kein globaler Zugriff auf `import.meta.env`), damit der Client in Tests
 * ohne Netzwerk instanziierbar bleibt.
 */

import { ApiError, type ApiUrlSource } from './errors'
import { normalizeInstruments, normalizeQuote } from './normalizers'
import { translate } from '@/i18n'
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
    return normalizeInstruments(await this.request<unknown>('/instruments'), `${this.baseUrl}/instruments`)
  }

  /** Kurs zu einer ISIN (bevorzugt Xetra/EUR). */
  async getQuoteByIsin(isin: string): Promise<QuoteResponse> {
    return this.requestQuote(`/quote/${encodeURIComponent(isin)}`)
  }

  /** Kurs zu einem vollständigen Yahoo-Symbol inkl. Suffix, z.B. `VGWL.DE`. */
  async getQuoteBySymbol(symbol: string): Promise<QuoteResponse> {
    return this.requestQuote(`/quote?symbol=${encodeURIComponent(symbol)}`)
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
    return this.requestQuote(`/refresh/${encodeURIComponent(isin)}`, 'POST')
  }

  /**
   * Dasselbe für Papiere ohne ISIN.
   *
   * Ohne diesen Weg fiel ein solches Papier still auf `getQuoteBySymbol`
   * zurück — der Dienst hätte dann seine TTL angewandt, und ein Knopf namens
   * „neu laden" hätte den zwischengespeicherten Kurs geliefert.
   */
  async refreshBySymbol(symbol: string): Promise<QuoteResponse> {
    return this.requestQuote(
      `/refresh/by-symbol/${encodeURIComponent(symbol)}`,
      'POST',
    )
  }

  /** Health-Check der API. */
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health')
  }

  /** Alle Kurswege durchlaufen dieselbe Prüfung, bevor ein Store sie erhält. */
  private async requestQuote(path: string, method: 'GET' | 'POST' = 'GET'): Promise<QuoteResponse> {
    return normalizeQuote(await this.request<unknown>(path, method), `${this.baseUrl}${path}`)
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
      // Die Herkunft der Adresse gehört an den Fehler: Hier ist sie bekannt,
      // später ließe sie sich nur noch raten — und wer eine falsche Adresse
      // sieht, muss wissen, wo er sie ändert.
      throw new ApiError(0, detail, url, apiUrlSource())
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
    if (body && typeof body === 'object' && 'code' in body && typeof body.code === 'string') {
      if (body.code === 'symbol_ambiguous' && 'params' in body && body.params && typeof body.params === 'object' && 'symbol' in body.params && typeof body.params.symbol === 'string') {
        return translate('errors.ambiguousSymbol', { symbol: body.params.symbol })
      }
      return body.code
    }
    if (body && typeof body === 'object' && 'detail' in body) {
      const detail = (body as { detail: unknown }).detail
      if (typeof detail === 'string') return detail
      return JSON.stringify(detail)
    }
  } catch {
    // Body war kein JSON — Statustext genügt.
  }
  return response.statusText || translate('notify.unknownError')
}

/**
 * Zur Laufzeit eingespielte Konfiguration.
 *
 * Wird im Container vom Entrypoint nach `config.js` geschrieben; im Betrieb
 * ohne Container liefert die Datei aus `public/` einen leeren Wert.
 */
declare global {
  interface Window {
    __STOCKPORTFOLIO_CONFIG__?: { apiUrl?: string; container?: boolean }
  }
}

/**
 * Fehlt die API-Adresse, gibt es nichts zu starten.
 *
 * Eigene Fehlerklasse, damit der Start sie von einem beliebigen anderen
 * Fehler unterscheiden und eine lesbare Seite zeigen kann.
 */
export class MissingApiUrlError extends Error {
  constructor() {
    super('STOCKINFO_API_URL ist nicht gesetzt')
    this.name = 'MissingApiUrlError'
  }
}

/**
 * Base-URL der API.
 *
 * Zwei Quellen, in dieser Reihenfolge:
 *
 * 1. `config.js` — vom Container-Entrypoint aus `STOCKINFO_API_URL` erzeugt.
 *    Ohne diesen Schritt wäre die Adresse ins Bündel gebacken und dasselbe
 *    Abbild ließe sich nicht auf ein anderes Backend richten; für jede
 *    Umgebung bräuchte es einen eigenen Build.
 * 2. `VITE_STOCKINFO_API_URL` aus dem `.env` — der Wert zur Bauzeit, damit
 *    Entwicklung und Vorschau ohne Container auskommen.
 *
 * Keine Rückfallebene: Eine fest eingebaute Adresse wäre für alle außer ihrem
 * Besitzer ein Name, der nicht auflöst — und der Fehler zeigte sich erst als
 * leere Kurstabelle. Die Adresse ist Pflicht, und fehlt sie, sagt das die App.
 *
 * @throws {MissingApiUrlError} Wenn keine der beiden Quellen etwas liefert.
 */
export function apiBaseUrl(): string {
  const runtime = globalThis.window?.__STOCKPORTFOLIO_CONFIG__?.apiUrl?.trim()
  if (runtime) return runtime

  const compiled = import.meta.env.VITE_STOCKINFO_API_URL?.trim()
  if (compiled) return compiled

  throw new MissingApiUrlError()
}

/**
 * Welche Quelle die Adresse gerade liefert — und wo man sie ändert.
 *
 * Dieselbe Reihenfolge wie in `apiBaseUrl` und bewusst daneben statt darin:
 * Der Wert wandert in jeden Netzwerkfehler, damit eine Meldung nicht nur die
 * unerreichbare Adresse nennt, sondern auch den Ort, an dem sie steht.
 *
 * Der Container ist der Grund für den dritten Fall. Sein Entrypoint schreibt
 * `config.js` immer — bei fehlender `STOCKINFO_API_URL` mit leerer Adresse.
 * Von der Platzhalter-Datei aus `public/` unterscheidet sie sich nur durch das
 * Kennzeichen `container`. Ohne diese Unterscheidung riete eine Meldung im
 * Container zur `.env`, die es dort nicht gibt.
 */
export function apiUrlSource(): ApiUrlSource {
  const config = globalThis.window?.__STOCKPORTFOLIO_CONFIG__
  if (config?.apiUrl?.trim()) return 'runtime'
  return config?.container ? 'container-build' : 'build'
}

/** Injection-Key für den Client (Vue provide/inject). */
export const STOCK_INFO_CLIENT = Symbol('stockInfoClient')
