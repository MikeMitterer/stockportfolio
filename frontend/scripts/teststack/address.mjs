// Adressen des Teststacks (scripts/test-stack.py) für die Prüfskripte unter
// frontend/scripts/. Die Ports stehen nur in scripts/teststack/ports.json und
// unterscheiden sich von denen aus make dev-up, damit beide Stacks
// nebeneinander laufen (T-150). Nur importieren, nicht direkt aufrufen.
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const portsFile = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../scripts/teststack/ports.json',
)
const ports = JSON.parse(readFileSync(portsFile, 'utf8'))

/** Herkunft der App im Teststack (Vite). */
export const testStackOrigin = `http://127.0.0.1:${ports.frontend}`

/** StockInfo-Testdienst des Teststacks, so wie die Konto-API ihn anspricht. */
export const testStackStockInfoUrl = `http://127.0.0.1:${ports.stockinfo}`
