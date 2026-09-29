import type { HttpBindings } from '@hono/node-server'
import { Hono, type Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { AccountService, ServiceError, type PublicUser } from '../auth/service.js'

type ServerContext = Context<{ Bindings: HttpBindings }>

export interface ApiOptions {
  publicOrigin?: string
  secureCookies: boolean
  remoteAddress: (context: ServerContext) => string
}

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

export function createApiRouter(service: AccountService, options: ApiOptions): Hono<{ Bindings: HttpBindings }> {
  const app = new Hono<{ Bindings: HttpBindings }>()

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

  app.all('/api/*', (context) => context.json({ error: 'not_found' }, 404))
  return app
}
