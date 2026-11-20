/** Routen für private Depotdaten je Konto, ihre Prüfung und den Ereignisstrom. */
import { streamSSE } from 'hono/streaming'
import { ServiceError, type AccountService } from '../auth/service.js'
import { ResourceEvents } from '../data/events.js'
import type { AccountRepository } from '../persistence/repository.js'
import type { LegacyPortfolio, ResourceKind, RestoreData } from '../persistence/privateData.js'
import { body, readObject, readRevision, readString, type ApiApp } from './request.js'
import { authenticated, currentUser, type SessionCookie } from './session.js'

function readResourceKind(value: string): ResourceKind {
  if (
    value !== 'portfolio' &&
    value !== 'settings' &&
    value !== 'allowlist' &&
    value !== 'snapshots' &&
    value !== 'quote-refresh'
  ) {
    throw new ServiceError(404, 'not_found')
  }
  return value
}

/**
 * Mindestform je Ressourcenart. Nicht-Objekte lehnt `readObject` mit
 * `invalid_request` ab, eine falsche Form gibt `false` und damit
 * `invalid_data`.
 */
const RESOURCE_SHAPES: Record<ResourceKind, (id: string, value: unknown) => boolean> = {
  snapshots: (_id, value) =>
    Array.isArray(value) &&
    value.every((entry) => {
      const row = readObject(entry)
      return (
        typeof row.date === 'string' &&
        typeof row.currency === 'string' &&
        typeof row.total === 'number' &&
        Number.isFinite(row.total)
      )
    }),
  'quote-refresh': (id, value) => {
    const record = readObject(value)
    return (
      id === 'current' &&
      typeof record.refreshedAt === 'string' &&
      Number.isFinite(Date.parse(record.refreshedAt))
    )
  },
  portfolio: (id, value) => {
    const record = readObject(value)
    return record.id === id && typeof record.name === 'string' && Array.isArray(record.positions)
  },
  settings: (id, value) => {
    const record = readObject(value)
    return id === 'current' && typeof record.activePortfolioId === 'string'
  },
  allowlist: (_id, value) =>
    Object.values(readObject(value)).every((enabled) => typeof enabled === 'boolean'),
}

function validateResource(kind: ResourceKind, id: string, value: unknown): void {
  if (!RESOURCE_SHAPES[kind](id, value)) throw new ServiceError(400, 'invalid_data')
}

function readLegacyPortfolios(value: unknown): LegacyPortfolio[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 1000)
    throw new ServiceError(400, 'invalid_data')
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
  if (new Set(entries.map((entry) => entry.portfolio.id)).size !== entries.length)
    throw new ServiceError(400, 'invalid_data')
  return entries
}

export interface PrivateDataRouteOptions {
  service: AccountService
  repository: AccountRepository
  cookie: SessionCookie
  heartbeatMs: number
}

export function registerPrivateDataRoutes(
  app: ApiApp,
  { service, repository, cookie, heartbeatMs }: PrivateDataRouteOptions,
): void {
  const events = new ResourceEvents()

  app.get('/api/data/events', (context) => {
    // Das Token nach einem möglichen Tausch: Die offene Verbindung prüft es weiter.
    const { user, session } = authenticated(context, service, cookie)
    context.header('Cache-Control', 'no-cache')
    context.header('X-Accel-Buffering', 'no')
    return streamSSE(context, async (stream) => {
      const subscription = events.subscribe(user.id)
      stream.onAbort(() => subscription.close())
      try {
        await stream.write(': connected\n\n')
        while (!stream.aborted) {
          const event = await subscription.next(heartbeatMs)
          if (stream.aborted) break
          if (!service.isActive(session.token)) break
          if (event) await stream.writeSSE({ event: 'resource', data: JSON.stringify(event) })
          else await stream.write(': keep-alive\n\n')
        }
      } finally {
        subscription.close()
      }
    })
  })

  app.get('/api/data/:kind', (context) => {
    const user = currentUser(context, service, cookie)
    const kind = readResourceKind(context.req.param('kind'))
    return context.json({ resources: repository.listResources(user.id, kind) })
  })

  app.get('/api/data/:kind/:id', (context) => {
    const user = currentUser(context, service, cookie)
    const kind = readResourceKind(context.req.param('kind'))
    const resource = repository.findResource(user.id, kind, context.req.param('id'))
    if (!resource) throw new ServiceError(404, 'not_found')
    return context.json(resource)
  })

  app.put('/api/data/:kind/:id', async (context) => {
    const user = currentUser(context, service, cookie)
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
    const user = currentUser(context, service, cookie)
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
    const user = currentUser(context, service, cookie)
    const request = await body(context)
    const portfolios = readLegacyPortfolios(request.portfolios)
    const settings =
      request.settings === null || request.settings === undefined
        ? null
        : readObject(request.settings)
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
    const user = currentUser(context, service, cookie)
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
    const removed =
      replacedId && replacedId !== id
        ? (['portfolio', 'allowlist', 'snapshots'] as const).flatMap((kind) => {
            const resource = repository.findResource(user.id, kind, replacedId)
            return resource
              ? [{ kind, resourceId: replacedId, revision: resource.revision + 1 }]
              : []
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
}
