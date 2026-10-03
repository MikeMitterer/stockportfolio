/**
 * HTTP-Client für die StockInfo-API.
 *
 * Einzige Stelle im Projekt, die StockInfo-Pfade kennt. Seit T-82 laufen alle
 * Abfragen über den eigenen Server (`/api/stockinfo`); der Browser spricht
 * StockInfo nicht mehr direkt an. Welche Adresse der Server dafür nutzt,
 * liefert `target()` — nur für die Anzeige.
 */

import { ApiError } from './errors'
import { normalizeFields, normalizeFx, normalizeInstruments, normalizeInstrumentTypes, normalizeQuote } from './normalizers'
import { translate } from '@/i18n'
import type {
  DailyPoint,
  FieldsResponse,
  FxResponse,
  HealthResponse,
  InstrumentSummary,
  InstrumentTypesResponse,
  Period,
  QuotePoint,
  QuoteResponse,
} from './types'

/** Injizierbare fetch-Implementierung — erlaubt Mocking in Tests. */
export type FetchFn = typeof globalThis.fetch

/** Weiterleitung des eigenen Servers zu StockInfo. */
export const STOCKINFO_PROXY_PATH = '/api/stockinfo'

/** Nennt die vom Server genutzte StockInfo-Adresse. */
const STOCKINFO_TARGET_PATH = '/api/stockinfo-target'

export class StockInfoClient {
  private readonly baseUrl: string
  private readonly fetchFn: FetchFn

  /**
   * @param baseUrl Basis-URL ohne trailing slash; Standard ist die Weiterleitung
   *   des eigenen Servers. Tests geben eine eigene Adresse an.
   * @param fetchFn Optionale fetch-Implementierung (Default: globales `fetch`).
   */
  constructor(baseUrl: string = STOCKINFO_PROXY_PATH, fetchFn: FetchFn = globalThis.fetch.bind(globalThis)) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.fetchFn = fetchFn
  }

  /** Basis der Anfragen; Stores nutzen sie als Schlüssel ihres Caches. */
  get url(): string {
    return this.baseUrl
  }

  /**
   * StockInfo-Adresse, die der Server aus `STOCKINFO_API_URL` nutzt.
   *
   * @returns Die Adresse oder `null`, wenn der Server keine kennt.
   */
  async target(): Promise<string | null> {
    const body = await this.request<{ url?: unknown }>(STOCKINFO_TARGET_PATH, 'GET', false)
    return typeof body.url === 'string' && body.url ? body.url : null
  }

  /** Katalog aller bekannten Instrumente. */
  async getInstruments(): Promise<InstrumentSummary[]> {
    return normalizeInstruments(await this.request<unknown>('/instruments'), `${this.baseUrl}/instruments`)
  }

  /** Felddefinitionen werden unabhängig von den Kursen geladen. */
  async getFields(): Promise<FieldsResponse> {
    return normalizeFields(await this.request<unknown>('/fields'), `${this.baseUrl}/fields`)
  }

  /** Verfügbare Plugin-Typen, unabhängig von bereits aufgenommenen Assets. */
  async getInstrumentTypes(): Promise<InstrumentTypesResponse> {
    return normalizeInstrumentTypes(await this.request<unknown>('/instrument-types'), `${this.baseUrl}/instrument-types`)
  }

  /** Eine Einheit Ausgangswährung entspricht rate Einheiten Zielwährung. */
  async getFx(base: string, quote: string): Promise<FxResponse> {
    const path = `/fx?base=${encodeURIComponent(base)}&quote=${encodeURIComponent(quote)}`
    return normalizeFx(await this.request<unknown>(path), base, quote, `${this.baseUrl}${path}`)
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
   * @param relative Pfad an die Basis anhängen (Standard) oder unverändert nutzen.
   * @returns Deserialisierter Response-Body.
   * @throws {ApiError} Bei Netzwerkfehler (`status: 0`) oder HTTP-Status >= 400.
   */
  private async request<T>(path: string, method: 'GET' | 'POST' = 'GET', relative = true): Promise<T> {
    const url = relative ? `${this.baseUrl}${path}` : path

    let response: Response
    try {
      response = await this.fetchFn(url, {
        method,
        // Der eigene Server verlangt bei POST JSON und prüft die Herkunft.
        headers: method === 'POST'
          ? { Accept: 'application/json', 'Content-Type': 'application/json' }
          : { Accept: 'application/json' },
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
    // Fehler der Weiterleitung selbst: StockInfo nicht erreichbar, zu langsam
    // oder nicht konfiguriert. Die übrigen Antworten stammen von StockInfo.
    if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' && body.error.startsWith('stockinfo_')) {
      return translate(`errors.stockinfo.${body.error}`)
    }
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

/** Injection-Key für den Client (Vue provide/inject). */
export const STOCK_INFO_CLIENT = Symbol('stockInfoClient')
