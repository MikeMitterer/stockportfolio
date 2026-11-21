import { readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { PROJECT_ROOT } from './projectRoot'

/** Frontend-Quellbaum, den die Wächter-Tests durchsuchen. */
export const SRC = resolve(PROJECT_ROOT, 'frontend/src')

/**
 * Alle Dateien unter `dir`, rekursiv, deren Name auf eine der Endungen endet.
 *
 * Eine Dateisuche für alle Wächter-Tests (T-136): Jeder nennt nur, welche
 * Dateiarten sein Muster betrifft.
 *
 * @param dir        Startordner.
 * @param extensions Endungen samt Punkt, etwa `['.vue', '.ts']`.
 */
export function filesUnder(dir: string, extensions: readonly string[]): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return filesUnder(path, extensions)
    return extensions.some((extension) => entry.name.endsWith(extension)) ? [path] : []
  })
}
