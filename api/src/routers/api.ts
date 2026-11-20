import { Hono } from 'hono'
import type { AccountService } from '../auth/service.js'
import { ServiceError } from '../auth/service.js'
import type { AccountRepository } from '../persistence/repository.js'
import {
  forwardToStockInfo,
  isAllowedStockInfoPath,
  STOCKINFO_TIMEOUT_MS,
  type ProxyFetch,
} from '../stockinfo/proxy.js'
import { registerAccountRoutes } from './accounts.js'
import { registerPrivateDataRoutes } from './privateData.js'
import type { ApiApp, ServerContext } from './request.js'
import { currentUser, renewPendingSession, type SessionCookie } from './session.js'

/*
 * Die Routen stehen nach fachlichem Bereich in eigenen Dateien (T-134):
 * Konten und Sitzungen in `accounts.ts`, private Depotdaten in
 * `privateData.ts`. Hier stehen die gemeinsamen Prüfungen, die
 * StockInfo-Weiterleitung und die Reihenfolge der Bereiche.
 */

export interface ApiOptions {
  publicOrigin?: string
  secureCookies: boolean
  remoteAddress: (context: ServerContext) => string
  heartbeatMs?: number
  /** StockInfo-Adresse aus `STOCKINFO_API_URL`, ohne Schrägstrich am Ende. */
  stockInfoUrl?: string | null
  /** fetch für die Weiterleitung; Tests ersetzen ihn. */
  stockInfoFetch?: ProxyFetch
  stockInfoTimeoutMs?: number
}

const stockInfoPrefix = '/api/stockinfo'

export function createApiRouter(
  service: AccountService,
  repository: AccountRepository,
  options: ApiOptions,
): ApiApp {
  const app: ApiApp = new Hono()
  const cookie: SessionCookie = {
    secure: options.secureCookies,
    maxAgeSeconds: Math.floor(service.sessionIdleMs / 1000),
  }

  app.onError((error, context) => {
    if (error instanceof ServiceError) {
      if (error.retryAfter !== undefined) context.header('Retry-After', String(error.retryAfter))
      return context.json({ error: error.code }, error.status as 400)
    }
    return context.json({ error: 'internal_error' }, 500)
  })

  app.use('/api/*', async (context, next) => {
    if (
      context.req.method === 'POST' ||
      context.req.method === 'PUT' ||
      context.req.method === 'PATCH' ||
      context.req.method === 'DELETE'
    ) {
      const expectedOrigin = options.publicOrigin ?? new URL(context.req.url).origin
      if (context.req.header('Origin') !== expectedOrigin)
        throw new ServiceError(403, 'invalid_origin')
      const contentType = context.req.header('Content-Type') ?? ''
      if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType))
        throw new ServiceError(415, 'json_required')
    }
    await next()
    renewPendingSession(context, service, cookie)
  })

  registerAccountRoutes(app, { service, cookie, remoteAddress: options.remoteAddress })
  registerPrivateDataRoutes(app, {
    service,
    repository,
    cookie,
    heartbeatMs: options.heartbeatMs ?? 15_000,
  })

  app.get('/api/stockinfo-target', (context) => {
    currentUser(context, service, cookie)
    return context.json({ url: options.stockInfoUrl ?? null })
  })

  // Weiterleitung der StockInfo-Abfragen (T-82): nur angemeldet, nur die
  // genutzten Pfade, ohne Cookies und Sitzungsdaten.
  app.on(['GET', 'POST'], `${stockInfoPrefix}/*`, (context) => {
    currentUser(context, service, cookie)
    const method = context.req.method === 'POST' ? 'POST' : 'GET'
    const url = new URL(context.req.url)
    const path = url.pathname.slice(stockInfoPrefix.length)
    if (!isAllowedStockInfoPath(method, path)) throw new ServiceError(404, 'not_found')
    if (!options.stockInfoUrl) throw new ServiceError(503, 'stockinfo_not_configured')
    return forwardToStockInfo(
      options.stockInfoUrl,
      method,
      `${path}${url.search}`,
      options.stockInfoFetch ?? ((input, init) => fetch(input, init)),
      options.stockInfoTimeoutMs ?? STOCKINFO_TIMEOUT_MS,
    )
  })

  app.all('/api/*', (context) => context.json({ error: 'not_found' }, 404))
  return app
}
