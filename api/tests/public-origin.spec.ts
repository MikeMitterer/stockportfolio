import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AccountService, hashSetupCode } from '../src/auth/service'
import { createSqliteRepository } from '../src/persistence/repository'
import { normalizePublicOrigin } from '../src/publicOrigin'
import { createApiRouter } from '../src/routers/api'

const directories: string[] = []

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe('STOCKPORTFOLIO_PUBLIC_ORIGIN', () => {
  it('liefert ohne Wert keinen Origin', () => {
    expect(normalizePublicOrigin(undefined)).toBeUndefined()
    expect(normalizePublicOrigin('')).toBeUndefined()
    expect(normalizePublicOrigin('   ')).toBeUndefined()
  })

  it('entfernt den Schrägstrich am Ende, wie ihn der Browser nie sendet', () => {
    expect(normalizePublicOrigin('https://portfolio.example.com/')).toBe('https://portfolio.example.com')
    expect(normalizePublicOrigin('http://192.168.1.10:8088/')).toBe('http://192.168.1.10:8088')
    expect(normalizePublicOrigin(' https://portfolio.example.com ')).toBe('https://portfolio.example.com')
  })

  it('schreibt Schema und Host klein und lässt den Standardport weg', () => {
    expect(normalizePublicOrigin('HTTPS://Portfolio.Example.COM')).toBe('https://portfolio.example.com')
    expect(normalizePublicOrigin('https://portfolio.example.com:443')).toBe('https://portfolio.example.com')
    expect(normalizePublicOrigin('http://portfolio.example.com:80/')).toBe('http://portfolio.example.com')
    expect(normalizePublicOrigin('https://portfolio.example.com:8443')).toBe('https://portfolio.example.com:8443')
  })

  it.each([
    ['portfolio.example.com', 'not a URL'],
    ['ftp://portfolio.example.com', 'scheme must be http or https'],
    ['https://portfolio.example.com/app', 'must not contain a path'],
    ['https://portfolio.example.com//', 'must not contain a path'],
    ['https://portfolio.example.com/.', 'must not contain a path'],
    ['https://portfolio.example.com/%2e', 'must not contain a path'],
    ['https://portfolio.example.com/a/..', 'must not contain a path'],
    ['https://portfolio.example.com/./', 'must not contain a path'],
    ['https://portfolio.example.com\\app', 'must not contain a path'],
    ['https://portfolio.example.com/?x=1', 'must not contain a query'],
    ['https://portfolio.example.com?', 'must not contain a query'],
    ['https://portfolio.example.com/#top', 'must not contain a fragment'],
    ['https://portfolio.example.com#', 'must not contain a fragment'],
  ])('bricht bei %s mit klarer Meldung ab', (value, reason) => {
    expect(() => normalizePublicOrigin(value)).toThrow(`STOCKPORTFOLIO_PUBLIC_ORIGIN "${value}" is invalid: ${reason}`)
  })

  it.each([
    ['https://user:synthetic-password@portfolio.example.com', 'must not contain user credentials'],
    ['https://:synthetic-password@portfolio.example.com/app', 'must not contain user credentials'],
    ['https://user:synthetic-password/x@portfolio.example.com', 'not a URL'],
    ['user:synthetic-password@portfolio.example.com', 'scheme must be http or https'],
  ])('schreibt bei %s kein Passwort in die Meldung', (value, reason) => {
    expect(() => normalizePublicOrigin(value)).toThrow(`STOCKPORTFOLIO_PUBLIC_ORIGIN is invalid: ${reason}`)
    expect(() => normalizePublicOrigin(value)).not.toThrow(/synthetic-password/)
  })

  it('lässt die Einrichtung zu, wenn der konfigurierte Wert einen Schrägstrich am Ende hat', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'stockportfolio-origin-'))
    directories.push(directory)
    const repository = createSqliteRepository(join(directory, 'test.sqlite'))
    const service = new AccountService(repository, hashSetupCode('setup-code'), () => 100_000)
    const app = createApiRouter(service, repository, {
      publicOrigin: normalizePublicOrigin('https://portfolio.example.com/'),
      secureCookies: false,
      remoteAddress: () => '10.0.0.1',
    })
    const response = await app.request('http://stockportfolio:8080/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://portfolio.example.com' },
      body: JSON.stringify({ code: 'setup-code', username: 'mike', password: 'Test-password-123' }),
    })
    expect(response.status).toBe(201)
    repository.close()
  })
})
