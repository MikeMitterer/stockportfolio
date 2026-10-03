import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Wurzel des Repositorys, bestimmt aus der Lage dieser Datei.
 *
 * Nicht `process.cwd()`: Die Wächter-Tests liefen sonst nur, wenn Vitest aus
 * dem Projektordner startet (wie `npm run test` mit `cd ..`). Aus `frontend/`
 * gestartet suchten sie `frontend/frontend/src` und scheiterten.
 *
 * `import.meta.url` geht als String an `fileURLToPath`: In der jsdom-Umgebung
 * ist `URL` die jsdom-Klasse, die `node:url` nicht als Datei-URL anerkennt.
 */
export const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
