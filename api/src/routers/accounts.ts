/** Routen für Einrichtung, Anmeldung, Passwort und Benutzerverwaltung. */
import { deleteCookie } from 'hono/cookie'
import { ServiceError, type AccountService } from '../auth/service.js'
import { body, readString, type ApiApp, type ServerContext } from './request.js'
import {
  cookieName,
  currentUser,
  requireAdmin,
  setSessionCookie,
  token,
  type SessionCookie,
} from './session.js'

export interface AccountRouteOptions {
  service: AccountService
  cookie: SessionCookie
  remoteAddress: (context: ServerContext) => string
}

export function registerAccountRoutes(
  app: ApiApp,
  { service, cookie, remoteAddress }: AccountRouteOptions,
): void {
  app.get('/api/setup/status', (context) => context.json({ required: service.setupRequired() }))

  app.post('/api/setup', async (context) => {
    const request = await body(context)
    const user = await service.setup(
      readString(request.code),
      readString(request.username),
      readString(request.password),
      remoteAddress(context),
    )
    return context.json({ user }, 201)
  })

  app.post('/api/auth/login', async (context) => {
    const request = await body(context)
    const result = await service.login(
      readString(request.username),
      readString(request.password),
      remoteAddress(context),
    )
    setSessionCookie(context, result.token, cookie)
    return context.json({ user: result.user })
  })

  app.get('/api/auth/session', (context) =>
    context.json({ user: currentUser(context, service, cookie, true) }),
  )

  app.post('/api/auth/logout', (context) => {
    service.logout(token(context))
    deleteCookie(context, cookieName, { path: '/', secure: cookie.secure })
    return context.json({ ok: true })
  })

  app.post('/api/auth/change-password', async (context) => {
    const user = currentUser(context, service, null, true)
    const request = await body(context)
    const newToken = await service.changePassword(user.id, readString(request.password))
    setSessionCookie(context, newToken, cookie)
    return context.json({ user: service.session(newToken) })
  })

  app.get('/api/admin/users', (context) => {
    requireAdmin(context, service, cookie)
    return context.json({ users: service.listUsers() })
  })

  app.post('/api/admin/users', async (context) => {
    requireAdmin(context, service, cookie)
    const request = await body(context)
    if (request.role !== 'admin' && request.role !== 'user')
      throw new ServiceError(400, 'invalid_role')
    const user = await service.createUser(
      readString(request.username),
      readString(request.password),
      request.role,
    )
    return context.json({ user }, 201)
  })

  app.post('/api/admin/users/:id/reset-password', async (context) => {
    requireAdmin(context, service, cookie)
    const request = await body(context)
    await service.resetPassword(context.req.param('id'), readString(request.password))
    return context.json({ ok: true })
  })

  app.post('/api/admin/users/:id/deactivate', (context) => {
    requireAdmin(context, service, cookie)
    service.deactivateUser(context.req.param('id'))
    return context.json({ ok: true })
  })

  app.post('/api/admin/users/:id/reactivate', (context) => {
    requireAdmin(context, service, cookie)
    service.reactivateUser(context.req.param('id'))
    return context.json({ ok: true })
  })
}
