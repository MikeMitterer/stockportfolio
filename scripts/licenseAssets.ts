import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** Lizenztexte und aktueller Quellstand für denselben Produktionsbuild. */
export function createLegalAssets(root: string): { fileName: string; source: Buffer }[] {
  const assets = ['LICENSE', 'LICENSE.de.txt', 'LICENSING.md', 'THIRD_PARTY_NOTICES.md'].map((file) => ({
    fileName: file === 'LICENSE' ? 'LICENSE.txt' : file,
    source: readFileSync(join(root, file)),
  }))
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { files: string[] }
  const directory = mkdtempSync(join(tmpdir(), 'stockportfolio-source-'))
  try {
    const archive = join(directory, 'stockportfolio-source.tgz')
    // Explizite Paketdateien statt gesamtem Arbeitsbaum: keine lokalen Daten,
    // Git-Historie oder Buildreste. Anders als npm pack bleibt der Lockfile dabei.
    execFileSync('tar', ['-czf', archive, '-C', root, '--', 'package.json', ...manifest.files], {
      // macOS darf keine Finder-Metadaten als zusätzliche ._-Dateien ausliefern.
      env: { ...process.env, COPYFILE_DISABLE: '1' },
    })
    assets.push({ fileName: 'stockportfolio-source.tgz', source: readFileSync(archive) })
    return assets
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}
