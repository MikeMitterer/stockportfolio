import type { HttpBindings } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { AccountService } from './auth/service.js'
import type { AccountRepository } from './persistence/repository.js'
import { createApiRouter, type ApiOptions } from './routers/api.js'

export interface ServerOptions extends ApiOptions {
  setupCodeHash: string | null
  publicDirectory: string
}

export function createServerApp(repository: AccountRepository, options: ServerOptions): Hono<{ Bindings: HttpBindings }> {
  const app = new Hono<{ Bindings: HttpBindings }>()
  const service = new AccountService(repository, options.setupCodeHash)

  app.get('/healthz', (context) => context.json({ status: 'ok' }))
  app.get('/admin/users', (context) => context.redirect('/#/admin/users', 302))
  app.route('/', createApiRouter(service, options))

  // Die Hash-Navigation lädt immer index.html; echte Dateien liefert der
  // statische Handler direkt aus. API-Fehler bleiben JSON-Antworten.
  app.use('/*', serveStatic({ root: options.publicDirectory }))
  app.get('*', serveStatic({ root: options.publicDirectory, path: 'index.html' }))
  return app
}
