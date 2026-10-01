import { afterEach, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createSqliteRepository } from '../src/persistence/repository'
import { createServerApp } from '../src/app'

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

it('liefert den Gesundheitsstatus und leitet die direkte Admin-Adresse in die Hash-Navigation', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'stockportfolio-app-'))
  directories.push(directory)
  const repository = createSqliteRepository(join(directory, 'test.sqlite'))
  const app = createServerApp(repository, {
    setupCodeHash: null,
    publicDirectory: directory,
    secureCookies: false,
    remoteAddress: () => '127.0.0.1',
  })
  expect((await app.request('http://localhost/healthz')).status).toBe(200)
  const redirect = await app.request('http://localhost/admin/users')
  expect(redirect.status).toBe(302)
  expect(redirect.headers.get('location')).toBe('/#/admin/users')
  repository.close()
})
