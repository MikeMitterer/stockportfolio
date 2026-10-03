import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createSqliteRepository } from '../src/persistence/repository'
import { AccountService, hashSetupCode } from '../src/auth/service'
import { createApiRouter } from '../src/routers/api'
import { isAllowedStockInfoPath, normalizeStockInfoUrl, type ProxyFetch } from '../src/stockinfo/proxy'

const directories: string[] = []
const origin = 'http://127.0.0.1:18080'
const stockInfo = 'http://stockinfo:8000'

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

interface Seen {
  url: string
  init: RequestInit
}

/** Konto-API mit Ersatz-StockInfo; `respond` bestimmt dessen Antwort. */
async function fixture(respond: ProxyFetch = async () => Response.json({ ok: true }), stockInfoUrl: string | null = stockInfo) {
  const directory = mkdtempSync(join(tmpdir(), 'stockportfolio-proxy-'))
  directories.push(directory)
  const repository = createSqliteRepository(join(directory, 'test.sqlite'))
  const service = new AccountService(repository, hashSetupCode('setup-code'))
  const seen: Seen[] = []
  const app = createApiRouter(service, repository, {
    publicOrigin: origin,
    secureCookies: false,
    remoteAddress: () => '10.0.0.1',
    stockInfoUrl,
    stockInfoTimeoutMs: 200,
    stockInfoFetch: async (url, init) => {
      seen.push({ url, init })
      return respond(url, init)
    },
  })
  const json = (body: unknown, cookie?: string) => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  })
  await app.request(`${origin}/api/setup`, json({ code: 'setup-code', username: 'mike', password: 'Test-password-123' }))
  const login = await app.request(`${origin}/api/auth/login`, json({ username: 'mike', password: 'Test-password-123' }))
  const cookie = login.headers.get('set-cookie')?.split(';')[0] ?? ''
  return { app, seen, cookie }
}

describe('StockInfo-Weiterleitung über den eigenen Server (T-82)', () => {
  it('lässt genau die vom Frontend genutzten Pfade und Methoden zu', () => {
    for (const path of ['/instruments', '/fields', '/instrument-types', '/fx', '/health', '/quote',
      '/quote/IE00B4L5Y983', '/quote/IE00B4L5Y983/daily', '/quote/IE00B4L5Y983/history',
      '/quote/by-symbol/VGWL.DE/daily', '/quote/VGWL%2FX/daily']) {
      expect(isAllowedStockInfoPath('GET', path), path).toBe(true)
    }
    for (const path of ['/refresh/IE00B4L5Y983', '/refresh/by-symbol/VGWL.DE']) {
      expect(isAllowedStockInfoPath('POST', path), path).toBe(true)
    }
    for (const [method, path] of [['GET', '/refresh/IE00B4L5Y983'], ['POST', '/quote/IE00B4L5Y983'],
      ['DELETE', '/instruments'], ['GET', '/instruments/1'], ['GET', '/docs'], ['GET', '/openapi.json'],
      ['GET', '/quote/by-symbol'], ['POST', '/refresh/by-symbol'], ['GET', ''], ['GET', '/'],
      ['GET', '/quote/a/b/c'], ['PUT', '/fields']]) {
      expect(isAllowedStockInfoPath(method, path), `${method} ${path}`).toBe(false)
    }
  })

  it('leitet Pfad, Abfrage, Status und Rumpf unverändert weiter, ohne Cookies', async () => {
    const { app, seen, cookie } = await fixture(async () => new Response('{"detail":"kein Kurs"}', {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'stockinfo=1', 'X-Internal': 'geheim' },
    }))
    const response = await app.request(`${origin}/api/stockinfo/quote/by-symbol/VGWL.DE/daily?period=3m`, {
      headers: { Cookie: `${cookie}; other=1`, Authorization: 'Bearer x' },
    })
    expect(response.status).toBe(404)
    expect(await response.text()).toBe('{"detail":"kein Kurs"}')
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(response.headers.get('set-cookie')).toBeNull()
    expect(response.headers.get('x-internal')).toBeNull()
    expect(seen).toHaveLength(1)
    expect(seen[0]?.url).toBe(`${stockInfo}/quote/by-symbol/VGWL.DE/daily?period=3m`)
    expect(seen[0]?.init.method).toBe('GET')
    expect(seen[0]?.init.headers).toEqual({ Accept: 'application/json' })
  })

  it('leitet Kursabrufe als POST weiter und prüft dabei Herkunft und JSON', async () => {
    const { app, seen, cookie } = await fixture()
    const refreshed = await app.request(`${origin}/api/stockinfo/refresh/IE00B4L5Y983`, {
      method: 'POST', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' },
    })
    expect(refreshed.status).toBe(200)
    expect(seen[0]?.init.method).toBe('POST')
    expect((await app.request(`${origin}/api/stockinfo/refresh/IE00B4L5Y983`, {
      method: 'POST', headers: { Cookie: cookie, Origin: 'https://foreign.example', 'Content-Type': 'application/json' },
    })).status).toBe(403)
    expect(seen).toHaveLength(1)
  })

  it('weist ohne Anmeldung und nicht freigegebene Pfade ab, ohne StockInfo zu fragen', async () => {
    const { app, seen, cookie } = await fixture()
    expect((await app.request(`${origin}/api/stockinfo/instruments`)).status).toBe(401)
    expect((await app.request(`${origin}/api/stockinfo-target`)).status).toBe(401)
    expect((await app.request(`${origin}/api/stockinfo/docs`, { headers: { Cookie: cookie } })).status).toBe(404)
    expect((await app.request(`${origin}/api/stockinfo/refresh/X`, { headers: { Cookie: cookie } })).status).toBe(404)
    expect(seen).toHaveLength(0)
  })

  it('meldet einen nicht erreichbaren, zu langsamen oder fehlenden StockInfo-Dienst', async () => {
    const unreachable = await fixture(async () => { throw new TypeError('fetch failed') })
    const down = await unreachable.app.request(`${origin}/api/stockinfo/health`, { headers: { Cookie: unreachable.cookie } })
    expect(down.status).toBe(502)
    expect(await down.json()).toEqual({ error: 'stockinfo_unreachable' })

    const slow = await fixture((_url, init) => new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(init.signal?.reason))
    }))
    const late = await slow.app.request(`${origin}/api/stockinfo/health`, { headers: { Cookie: slow.cookie } })
    expect(late.status).toBe(504)
    expect(await late.json()).toEqual({ error: 'stockinfo_timeout' })

    const missing = await fixture(undefined, null)
    const none = await missing.app.request(`${origin}/api/stockinfo/health`, { headers: { Cookie: missing.cookie } })
    expect(none.status).toBe(503)
    expect(await none.json()).toEqual({ error: 'stockinfo_not_configured' })
    expect(missing.seen).toHaveLength(0)
  })

  it('nennt angemeldeten Nutzern die konfigurierte Adresse', async () => {
    const configured = await fixture()
    expect(await (await configured.app.request(`${origin}/api/stockinfo-target`, { headers: { Cookie: configured.cookie } })).json())
      .toEqual({ url: stockInfo })
    const missing = await fixture(undefined, null)
    expect(await (await missing.app.request(`${origin}/api/stockinfo-target`, { headers: { Cookie: missing.cookie } })).json())
      .toEqual({ url: null })
  })

  it('liest STOCKINFO_API_URL ohne Leerraum und abschließenden Schrägstrich', () => {
    expect(normalizeStockInfoUrl(' http://stockinfo:8000/ ')).toBe('http://stockinfo:8000')
    expect(normalizeStockInfoUrl('')).toBeNull()
    expect(normalizeStockInfoUrl(undefined)).toBeNull()
  })
})
