import type { HttpBindings } from '@hono/node-server'
import { Hono, type Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { streamSSE } from 'hono/streaming'
import { AccountService, ServiceError, type PublicUser } from '../auth/service.js'
import { ResourceEvents } from '../data/events.js'
import type { AccountRepository, LegacyPortfolio, ResourceKind, RestoreData } from '../persistence/repository.js'
import { forwardToStockInfo, isAllowedStockInfoPath, STOCKINFO_TIMEOUT_MS, type ProxyFetch } from '../stockinfo/proxy.js'

type ServerContext = Context<{ Bindings: HttpBindings }>

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

const cookieName = 'stockportfolio_session'
const cookieLifetimeSeconds = 7 * 24 * 60 * 60

function readObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ServiceError(400, 'invalid_request')
  }
  return value as Record<string, unknown>
}

function readString(value: unknown): string {
  if (typeof value !== 'string') throw new ServiceError(400, 'invalid_request')
  return value
}

function readRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new ServiceError(400, 'invalid_revision')
  return value as number
}

function readResourceKind(value: string): ResourceKind {
  if (value !== 'portfolio' && value !== 'settings' && value !== 'allowlist' && value !== 'snapshots' && value !== 'quote-refresh') {
    throw new ServiceError(404, 'not_found')
  }
  return value
}

function validateResource(kind: ResourceKind, id: string, value: unknown): void {
  if (kind === 'snapshots') {
    if (!Array.isArray(value) || value.some((entry) => {
      const row = readObject(entry)
      return typeof row.date !== 'string' || typeof row.currency !== 'string' || typeof row.total !== 'number' || !Number.isFinite(row.total)
    })) throw new ServiceError(400, 'invalid_data')
    return
  }
  const record = readObject(value)
  if (kind === 'quote-refresh' && (id !== 'current' || typeof record.refreshedAt !== 'string' || !Number.isFinite(Date.parse(record.refreshedAt)))) {
    throw new ServiceError(400, 'invalid_data')
  }
  if (kind === 'portfolio' && (record.id !== id || typeof record.name !== 'string' || !Array.isArray(record.positions))) {
    throw new ServiceError(400, 'invalid_data')
  }
  if (kind === 'settings' && (id !== 'current' || typeof record.activePortfolioId !== 'string')) {
    throw new ServiceError(400, 'invalid_data')
  }
  if (kind === 'allowlist' && Object.values(record).some((enabled) => typeof enabled !== 'boolean')) {
    throw new ServiceError(400, 'invalid_data')
  }
}

function readLegacyPortfolios(value: unknown): LegacyPortfolio[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 1000) throw new ServiceError(400, 'invalid_data')
  const entries = value.map((item) => {
    const source = readObject(item)
    const portfolio = readObject(source.portfolio ?? source)
    const id = readString(portfolio.id)
    validateResource('portfolio', id, portfolio)
    const allowlist = readObject(source.allowlist ?? {}) as Record<string, boolean>
    validateResource('allowlist', id, allowlist)
    const snapshots = source.snapshots ?? []
    validateResource('snapshots', id, snapshots)
    return { portfolio, allowlist, snapshots: snapshots as unknown[] }
  })
  if (new Set(entries.map((entry) => entry.portfolio.id)).size !== entries.length) throw new ServiceError(400, 'invalid_data')
  return entries
}

async function body(context: ServerContext): Promise<Record<string, unknown>> {
  try {
    return readObject(await context.req.json())
  } catch (error) {
    if (error instanceof ServiceError) throw error
    throw new ServiceError(400, 'invalid_json')
  }
}

function token(context: ServerContext): string {
  const value = getCookie(context, cookieName)
  if (!value) throw new ServiceError(401, 'unauthorized')
  return value
}

function currentUser(context: ServerContext, service: AccountService, allowPasswordChange = false): PublicUser {
  const user = service.session(token(context))
  if (user.mustChangePassword && !allowPasswordChange) throw new ServiceError(403, 'password_change_required')
  return user
}

function requireAdmin(context: ServerContext, service: AccountService): PublicUser {
  const user = currentUser(context, service)
  if (user.role !== 'admin') throw new ServiceError(403, 'forbidden')
  return user
}

function setSessionCookie(context: ServerContext, value: string, secure: boolean): void {
  setCookie(context, cookieName, value, {
    httpOnly: true,
    sameSite: 'Lax',
    secure,
    path: '/',
    maxAge: cookieLifetimeSeconds,
  })
}

export function createApiRouter(service: AccountService, repository: AccountRepository, options: ApiOptions): Hono<{ Bindings: HttpBindings }> {
  const app = new Hono<{ Bindings: HttpBindings }>()
  const events = new ResourceEvents()

  app.onError((error, context) => {
    if (error instanceof ServiceError) {
      if (error.retryAfter !== undefined) context.header('Retry-After', String(error.retryAfter))
      return context.json({ error: error.code }, error.status as 400)
    }
    return context.json({ error: 'internal_error' }, 500)
  })

  app.use('/api/*', async (context, next) => {
    if (context.req.method === 'POST' || context.req.method === 'PUT' || context.req.method === 'PATCH' || context.req.method === 'DELETE') {
      const expectedOrigin = options.publicOrigin ?? new URL(context.req.url).origin
      if (context.req.header('Origin') !== expectedOrigin) throw new ServiceError(403, 'invalid_origin')
      const contentType = context.req.header('Content-Type') ?? ''
      if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType)) throw new ServiceError(415, 'json_required')
    }
    await next()
  })

  app.get('/api/setup/status', (context) => context.json({ required: service.setupRequired() }))

  app.post('/api/setup', async (context) => {
    const request = await body(context)
    const user = await service.setup(
      readString(request.code),
      readString(request.username),
      readString(request.password),
      options.remoteAddress(context),
    )
    return context.json({ user }, 201)
  })

  app.post('/api/auth/login', async (context) => {
    const request = await body(context)
    const result = await service.login(readString(request.username), readString(request.password), options.remoteAddress(context))
    setSessionCookie(context, result.token, options.secureCookies)
    return context.json({ user: result.user })
  })

  app.get('/api/auth/session', (context) => context.json({ user: currentUser(context, service, true) }))

  app.post('/api/auth/logout', (context) => {
    service.logout(token(context))
    deleteCookie(context, cookieName, { path: '/', secure: options.secureCookies })
    return context.json({ ok: true })
  })

  app.post('/api/auth/change-password', async (context) => {
    const user = currentUser(context, service, true)
    const request = await body(context)
    const newToken = await service.changePassword(user.id, readString(request.password))
    setSessionCookie(context, newToken, options.secureCookies)
    return context.json({ user: service.session(newToken) })
  })

  app.get('/api/admin/users', (context) => {
    requireAdmin(context, service)
    return context.json({ users: service.listUsers() })
  })

  app.post('/api/admin/users', async (context) => {
    requireAdmin(context, service)
    const request = await body(context)
    if (request.role !== 'admin' && request.role !== 'user') throw new ServiceError(400, 'invalid_role')
    const user = await service.createUser(readString(request.username), readString(request.password), request.role)
    return context.json({ user }, 201)
  })

  app.post('/api/admin/users/:id/reset-password', async (context) => {
    requireAdmin(context, service)
    const request = await body(context)
    await service.resetPassword(context.req.param('id'), readString(request.password))
    return context.json({ ok: true })
  })

  app.post('/api/admin/users/:id/deactivate', (context) => {
    requireAdmin(context, service)
    service.deactivateUser(context.req.param('id'))
    return context.json({ ok: true })
  })

  app.post('/api/admin/users/:id/reactivate', (context) => {
    requireAdmin(context, service)
    service.reactivateUser(context.req.param('id'))
    return context.json({ ok: true })
  })

  app.get('/api/data/events', (context) => {
    const sessionToken = token(context)
    const user = currentUser(context, service)
    context.header('Cache-Control', 'no-cache')
    context.header('X-Accel-Buffering', 'no')
    return streamSSE(context, async (stream) => {
      const subscription = events.subscribe(user.id)
      stream.onAbort(() => subscription.close())
      try {
        await stream.write(': connected\n\n')
        while (!stream.aborted) {
          const event = await subscription.next(options.heartbeatMs ?? 15_000)
          if (stream.aborted) break
          try {
            service.session(sessionToken)
          } catch {
            break
          }
          if (event) await stream.writeSSE({ event: 'resource', data: JSON.stringify(event) })
          else await stream.write(': keep-alive\n\n')
        }
      } finally {
        subscription.close()
      }
    })
  })

  app.get('/api/data/:kind', (context) => {
    const user = currentUser(context, service)
    const kind = readResourceKind(context.req.param('kind'))
    return context.json({ resources: repository.listResources(user.id, kind) })
  })

  app.get('/api/data/:kind/:id', (context) => {
    const user = currentUser(context, service)
    const kind = readResourceKind(context.req.param('kind'))
    const resource = repository.findResource(user.id, kind, context.req.param('id'))
    if (!resource) throw new ServiceError(404, 'not_found')
    return context.json(resource)
  })

  app.put('/api/data/:kind/:id', async (context) => {
    const user = currentUser(context, service)
    const kind = readResourceKind(context.req.param('kind'))
    const id = context.req.param('id')
    const request = await body(context)
    const revision = readRevision(request.revision)
    validateResource(kind, id, request.value)
    const nextRevision = repository.saveResource(user.id, kind, id, revision, request.value)
    if (nextRevision === 'not_found') throw new ServiceError(404, 'not_found')
    if (nextRevision === null) throw new ServiceError(409, 'revision_conflict')
    events.publish(user.id, { kind, resourceId: id, revision: nextRevision })
    return context.json({ revision: nextRevision })
  })

  app.delete('/api/data/:kind/:id', async (context) => {
    const user = currentUser(context, service)
    const kind = readResourceKind(context.req.param('kind'))
    // Offene Fenster vergleichen die Revision des Kurs-Hinweises. Nach einem
    // Löschen begänne sie wieder bei 1, und spätere Hinweise blieben unbeachtet.
    if (kind === 'quote-refresh') throw new ServiceError(405, 'not_deletable')
    const id = context.req.param('id')
    const request = await body(context)
    const revision = readRevision(request.revision)
    const result = repository.deleteResource(user.id, kind, id, revision)
    if (result === 'not_found') throw new ServiceError(404, 'not_found')
    if (result === 'conflict') throw new ServiceError(409, 'revision_conflict')
    events.publish(user.id, { kind, resourceId: id, revision: revision + 1 })
    return context.json({ ok: true })
  })

  app.post('/api/data/legacy-import', async (context) => {
    const user = currentUser(context, service)
    const request = await body(context)
    const portfolios = readLegacyPortfolios(request.portfolios)
    const settings = request.settings === null || request.settings === undefined ? null : readObject(request.settings)
    if (settings) validateResource('settings', 'current', settings)
    const previousSettings = repository.findResource(user.id, 'settings', 'current')
    const result = repository.importLegacy(user.id, portfolios, settings)
    if (result === 'forbidden') throw new ServiceError(403, 'forbidden')
    if (result === 'imported') throw new ServiceError(409, 'legacy_already_imported')
    if (result === 'conflict') throw new ServiceError(409, 'revision_conflict')
    for (const entry of portfolios) {
      const resourceId = String(entry.portfolio.id)
      for (const kind of ['portfolio', 'allowlist', 'snapshots'] as const) {
        events.publish(user.id, { kind, resourceId, revision: 1 })
      }
    }
    if (settings && !previousSettings) {
      events.publish(user.id, { kind: 'settings', resourceId: 'current', revision: 1 })
    }
    return context.json({ ok: true })
  })

  app.post('/api/data/restore', async (context) => {
    const user = currentUser(context, service)
    const request = await body(context)
    const portfolio = readObject(request.portfolio)
    const id = readString(portfolio.id)
    validateResource('portfolio', id, portfolio)
    const settings = readObject(request.settings)
    validateResource('settings', 'current', settings)
    if (settings.activePortfolioId !== id) throw new ServiceError(400, 'invalid_data')
    const allowlist = readObject(request.allowlist) as Record<string, boolean>
    validateResource('allowlist', id, allowlist)
    validateResource('snapshots', id, request.snapshots)
    const revisions = readObject(request.revisions)
    const replacedId = request.replacedId === null ? null : readString(request.replacedId)
    const data: RestoreData = {
      portfolio,
      settings,
      allowlist,
      snapshots: request.snapshots as unknown[],
      replacedId,
      revisions: {
        portfolio: readRevision(revisions.portfolio),
        settings: readRevision(revisions.settings),
        allowlist: readRevision(revisions.allowlist),
        snapshots: readRevision(revisions.snapshots),
        replaced: revisions.replaced === null ? null : readRevision(revisions.replaced),
      },
    }
    const removed = replacedId && replacedId !== id
      ? (['portfolio', 'allowlist', 'snapshots'] as const).flatMap((kind) => {
          const resource = repository.findResource(user.id, kind, replacedId)
          return resource ? [{ kind, resourceId: replacedId, revision: resource.revision + 1 }] : []
        })
      : []
    const result = repository.restoreBackup(user.id, data)
    if (result === 'not_found') throw new ServiceError(404, 'not_found')
    if (result === 'conflict') throw new ServiceError(409, 'revision_conflict')
    for (const event of removed) events.publish(user.id, event)
    for (const [kind, resourceId, revision] of [
      ['portfolio', id, data.revisions.portfolio],
      ['settings', 'current', data.revisions.settings],
      ['allowlist', id, data.revisions.allowlist],
      ['snapshots', id, data.revisions.snapshots],
    ] as const) {
      events.publish(user.id, { kind, resourceId, revision: revision + 1 })
    }
    return context.json({ ok: true })
  })

  // Konfigurierte StockInfo-Adresse für Statusseite und Statuszeile. Der
  // Browser erreicht sie womöglich nicht selbst; angezeigt wird sie trotzdem.
  app.get('/api/stockinfo-target', (context) => {
    currentUser(context, service)
    return context.json({ url: options.stockInfoUrl ?? null })
  })

  // Weiterleitung der StockInfo-Abfragen (T-82): nur angemeldet, nur die
  // genutzten Pfade, ohne Cookies und Sitzungsdaten.
  app.on(['GET', 'POST'], `${stockInfoPrefix}/*`, (context) => {
    currentUser(context, service)
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
