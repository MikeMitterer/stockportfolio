// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { gunzipSync } from 'node:zlib'
import { createLegalAssets } from '../scripts/licenseAssets'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('Lizenzartefakte', () => {
  it('liefert die eigene Konto-API samt Lockfile und Migrationen im Projektarchiv mit', () => {
    const root = fileURLToPath(new URL('../..', import.meta.url))
    const archive = createLegalAssets(root).find((asset) => asset.fileName === 'stockportfolio-source.tgz')!.source
    const directory = mkdtempSync(join(tmpdir(), 'stockportfolio-license-api-'))
    temporaryDirectories.push(directory)
    const path = join(directory, 'source.tgz')
    writeFileSync(path, archive)
    const listing = execFileSync('tar', ['-tzf', path], { encoding: 'utf8' })
    for (const name of ['api/src/index.ts', 'api/package-lock.json', 'api/drizzle/0000_majestic_shooting_star.sql']) {
      expect(listing).toContain(name)
    }
    expect(listing).not.toContain('docker/runtime/')
  })

  it('liefert Originaltexte und aktuelle Quellen ohne private Dateien oder Buildreste', () => {
    const root = mkdtempSync(join(tmpdir(), 'stockportfolio-license-test-'))
    temporaryDirectories.push(root)
    mkdirSync(join(root, 'frontend'))
    writeFileSync(join(root, 'frontend/package.json'), JSON.stringify({
      name: 'license-test', version: '1.0.0', private: true, sourceFiles: ['src'],
    }))
    mkdirSync(join(root, 'src'))
    writeFileSync(join(root, 'src', 'main.ts'), 'export const changed = true\n')
    if (process.platform === 'darwin') {
      execFileSync('xattr', ['-w', 'user.license-test', 'metadata', join(root, 'src', 'main.ts')])
    }
    writeFileSync(join(root, 'private.txt'), 'must-not-be-published')
    mkdirSync(join(root, 'dist'))
    writeFileSync(join(root, 'dist', 'stale.js'), 'old build')
    for (const file of ['LICENSE', 'LICENSE.de.txt', 'LICENSING.md', 'THIRD_PARTY_NOTICES.md']) {
      writeFileSync(join(root, file), `Original ${file}\n`)
    }
    const assets = createLegalAssets(root)
    for (const file of ['LICENSE', 'LICENSE.de.txt', 'LICENSING.md', 'THIRD_PARTY_NOTICES.md']) {
      const outputName = file === 'LICENSE' ? 'LICENSE.txt' : file
      expect(assets.find((asset) => asset.fileName === outputName)?.source)
        .toEqual(readFileSync(join(root, file)))
    }
    const archive = join(root, 'source.tgz')
    writeFileSync(archive, assets.find((asset) => asset.fileName === 'stockportfolio-source.tgz')!.source)
    const listing = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' })
    expect(listing).toContain('src/main.ts')
    expect(listing).not.toContain('private.txt')
    expect(listing).not.toContain('dist/')
    expect(gunzipSync(readFileSync(archive)).includes(Buffer.from('._main.ts'))).toBe(false)
    expect(execFileSync('tar', ['-xOzf', archive, 'src/main.ts'], { encoding: 'utf8' }))
      .toBe('export const changed = true\n')
  })

  it('bricht bei fehlendem Lizenztext ab', () => {
    const root = mkdtempSync(join(tmpdir(), 'stockportfolio-license-missing-'))
    temporaryDirectories.push(root)
    expect(() => createLegalAssets(root)).toThrow()
  })
})
