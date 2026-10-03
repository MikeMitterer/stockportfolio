/**
 * Weiterleitung der StockInfo-Abfragen über den eigenen Server (T-82).
 *
 * Der Browser spricht nur noch mit StockPortfolio. Dadurch braucht StockInfo
 * kein CORS für StockPortfolio, muss vom Browser aus nicht erreichbar sein und
 * darf im Docker-Netz unter einem internen Namen laufen. Weitergeleitet werden
 * ausschließlich die Pfade, die das Frontend tatsächlich nutzt; Cookies,
 * Sitzungsdaten und andere Kopfzeilen des Browsers gehen nicht an StockInfo.
 */

/** Pfad-Muster je Methode, gemessen am Pfad nach `/api/stockinfo`. */
const ALLOWED: Record<'GET' | 'POST', RegExp[]> = {
  GET: [
    /^\/instruments$/,
    /^\/fields$/,
    /^\/instrument-types$/,
    /^\/fx$/,
    /^\/health$/,
    /^\/quote$/,
    /^\/quote\/(?!by-symbol$)[^/]+$/,
    /^\/quote\/(?!by-symbol$)[^/]+\/daily$/,
    /^\/quote\/by-symbol\/[^/]+\/daily$/,
  ],
  POST: [
    /^\/refresh\/(?!by-symbol$)[^/]+$/,
    /^\/refresh\/by-symbol\/[^/]+$/,
  ],
}

/** Kopfzeilen der StockInfo-Antwort, die der Browser zu sehen bekommt. */
const PASSED_RESPONSE_HEADERS = ['content-type', 'cache-control', 'retry-after']

/** Ein Kursabruf bei StockInfo kann die Quellen erst fragen; das dauert. */
export const STOCKINFO_TIMEOUT_MS = 60_000

export type ProxyFetch = (input: string, init: RequestInit) => Promise<Response>

/** Ergebnis der Pfadprüfung: erlaubter Pfad oder Grund der Abweisung. */
export function isAllowedStockInfoPath(method: string, path: string): boolean {
  if (method !== 'GET' && method !== 'POST') return false
  return ALLOWED[method].some((pattern) => pattern.test(path))
}

/** Entfernt einen abschließenden Schrägstrich, damit Pfade sauber anschließen. */
export function normalizeStockInfoUrl(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed.replace(/\/+$/, '')
}

/** Fehlerantwort im Format der übrigen Konto-API. */
function errorResponse(status: number, code: string): Response {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Leitet eine bereits geprüfte Anfrage an StockInfo weiter.
 *
 * @param baseUrl  Konfigurierte StockInfo-Adresse ohne Schrägstrich am Ende.
 * @param method   `GET` oder `POST`.
 * @param pathAndQuery Pfad nach `/api/stockinfo` samt unverändertem Query-String.
 * @param fetchFn  fetch-Implementierung (in Tests ersetzt).
 * @param timeoutMs Zeitlimit; danach antwortet der Server mit 504.
 * @returns Die Antwort von StockInfo mit unverändertem Status und Rumpf, sonst
 *   502 bei nicht erreichbarem und 504 bei zu langsamem StockInfo.
 */
export async function forwardToStockInfo(
  baseUrl: string,
  method: 'GET' | 'POST',
  pathAndQuery: string,
  fetchFn: ProxyFetch,
  timeoutMs = STOCKINFO_TIMEOUT_MS,
): Promise<Response> {
  let upstream: Response
  try {
    upstream = await fetchFn(`${baseUrl}${pathAndQuery}`, {
      method,
      headers: { Accept: 'application/json' },
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    const name = error instanceof Error ? error.name : ''
    if (name === 'TimeoutError' || name === 'AbortError') return errorResponse(504, 'stockinfo_timeout')
    return errorResponse(502, 'stockinfo_unreachable')
  }
  const headers = new Headers()
  for (const name of PASSED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name)
    if (value !== null) headers.set(name, value)
  }
  return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers })
}
