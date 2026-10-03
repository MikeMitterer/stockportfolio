import { randomBytes } from 'node:crypto'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { createServerApp } from './app.js'
import { hashSetupCode } from './auth/service.js'
import { createSqliteRepository } from './persistence/repository.js'
import { normalizeStockInfoUrl } from './stockinfo/proxy.js'

const dataDirectory = resolve(process.env.STOCKPORTFOLIO_DATA_DIR ?? '/data')
const publicDirectory = resolve(process.env.STOCKPORTFOLIO_PUBLIC_DIR ?? fileURLToPath(new URL('../../dist', import.meta.url)))
const port = Number(process.env.PORT ?? '8080')
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT')

const stockInfoUrl = normalizeStockInfoUrl(process.env.STOCKINFO_API_URL)
if (!stockInfoUrl) console.warn('STOCKINFO_API_URL is not set; StockInfo requests answer 503')

const repository = createSqliteRepository(resolve(dataDirectory, 'stockportfolio.sqlite'))
const setupCode = repository.hasAdmin() ? null : randomBytes(24).toString('base64url')
if (setupCode) console.info(`StockPortfolio setup code: ${setupCode}`)

const app = createServerApp(repository, {
  setupCodeHash: setupCode ? hashSetupCode(setupCode) : null,
  publicDirectory,
  publicOrigin: process.env.STOCKPORTFOLIO_PUBLIC_ORIGIN || undefined,
  secureCookies: process.env.STOCKPORTFOLIO_SECURE_COOKIES === 'true',
  stockInfoUrl,
  remoteAddress: (context) => context.env?.incoming?.socket.remoteAddress ?? 'unknown',
})

const server = serve({ fetch: app.fetch, hostname: '0.0.0.0', port })
console.info(`StockPortfolio listening on ${port}`)

function shutdown(): void {
  server.close(() => {
    repository.close()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
