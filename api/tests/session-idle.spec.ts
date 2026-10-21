import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AccountService, hashSetupCode } from '../src/auth/service'
import { createSqliteRepository } from '../src/persistence/repository'
import { createApiRouter } from '../src/routers/api'
import { DEFAULT_SESSION_IDLE_DAYS, parseSessionIdleMs } from '../src/sessionIdle'

const directories: string[] = []
const origin = 'http://127.0.0.1:18080'
const dayMs = 24 * 60 * 60_000

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

async function signedIn(sessionIdleMs?: number) {
  const directory = mkdtempSync(join(tmpdir(), 'stockportfolio-session-'))
  directories.push(directory)
  const repository = createSqliteRepository(join(directory, 'test.sqlite'))
  let currentTime = 100_000
  const service = new AccountService(repository, hashSetupCode('setup-code'), () => currentTime, sessionIdleMs)
  const app = createApiRouter(service, repository, { publicOrigin: origin, secureCookies: false, remoteAddress: () => '10.0.0.1' })
  const post = (path: string, body: unknown, cookie?: string) => app.request(`${origin}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  })
  await post('/api/setup', { code: 'setup-code', username: 'mike', password: 'Test-password-123' })
  const login = await post('/api/auth/login', { username: 'mike', password: 'Test-password-123' })
  const loginCookie = login.headers.get('set-cookie') ?? ''
  const cookie = loginCookie.split(';')[0]
  return {
    repository,
    loginCookie,
    cookie,
    post,
    session: () => app.request(`${origin}/api/auth/session`, { headers: { Cookie: cookie } }),
    advance: (milliseconds: number) => { currentTime += milliseconds },
  }
}

describe('STOCKPORTFOLIO_SESSION_IDLE_DAYS', () => {
  it('nimmt ohne Wert sieben Tage', () => {
    expect(DEFAULT_SESSION_IDLE_DAYS).toBe(7)
    expect(parseSessionIdleMs(undefined)).toBe(7 * dayMs)
    expect(parseSessionIdleMs('')).toBe(7 * dayMs)
    expect(parseSessionIdleMs('  ')).toBe(7 * dayMs)
  })

  it('übernimmt ganze Tage von 1 bis 365', () => {
    expect(parseSessionIdleMs('1')).toBe(dayMs)
    expect(parseSessionIdleMs(' 30 ')).toBe(30 * dayMs)
    expect(parseSessionIdleMs('365')).toBe(365 * dayMs)
  })

  it.each(['0', '366', '-1', '1.5', '7d', 'sieben', '1e2', '0x10'])('beendet den Start bei %j mit verständlicher Meldung', (value) => {
    expect(() => parseSessionIdleMs(value)).toThrow(/STOCKPORTFOLIO_SESSION_IDLE_DAYS is invalid: expected whole days from 1 to 365/)
  })
})

describe('gleitende Sitzung (T-98)', () => {
  it('bleibt bei täglicher Nutzung über die frühere 7-Tage-Grenze hinaus angemeldet', async () => {
    const { repository, session, advance } = await signedIn()
    try {
      for (let day = 1; day <= 30; day++) {
        advance(dayMs)
        expect((await session()).status).toBe(200)
      }
    } finally {
      repository.close()
    }
  })

  it('läuft nach der Leerlauffrist ohne Nutzung ab, eine Nutzung kurz davor verlängert sie', async () => {
    const { repository, session, advance } = await signedIn(2 * dayMs)
    try {
      advance(2 * dayMs - 1)
      expect((await session()).status).toBe(200)
      advance(2 * dayMs - 1)
      expect((await session()).status).toBe(200)
      advance(2 * dayMs)
      expect((await session()).status).toBe(401)
    } finally {
      repository.close()
    }
  })

  it('hält auch mit Default-Frist nach sieben Tagen ohne Nutzung nicht mehr', async () => {
    const { repository, session, advance } = await signedIn()
    try {
      advance(7 * dayMs)
      expect((await session()).status).toBe(401)
    } finally {
      repository.close()
    }
  })

  it('gibt dem Cookie bei Anmeldung und jeder Nutzung die volle Leerlauffrist', async () => {
    const { repository, loginCookie, session, advance } = await signedIn(3 * dayMs)
    try {
      expect(loginCookie).toContain(`Max-Age=${3 * 24 * 60 * 60}`)
      advance(dayMs)
      const refreshed = (await session()).headers.get('set-cookie') ?? ''
      expect(refreshed).toContain(`Max-Age=${3 * 24 * 60 * 60}`)
      expect(refreshed).toContain('HttpOnly')
      expect(refreshed).toContain('SameSite=Lax')
    } finally {
      repository.close()
    }
  })

  it('setzt beim Passwortwechsel genau ein Sitzungscookie, das neue', async () => {
    const { repository, cookie, post, session } = await signedIn()
    try {
      const changed = await post('/api/auth/change-password', { password: 'Changed-password-123' }, cookie)
      expect(changed.status).toBe(200)
      const sessionCookies = changed.headers.getSetCookie().filter((value) => value.startsWith('stockportfolio_session='))
      expect(sessionCookies).toHaveLength(1)
      expect(sessionCookies[0].split(';')[0]).not.toBe(cookie)
      expect((await session()).status).toBe(401)
    } finally {
      repository.close()
    }
  })

  it('verlängert eine ungültige Sitzung nicht und beendet sie beim Abmelden sofort', async () => {
    const { repository, cookie, post, session } = await signedIn()
    try {
      expect((await post('/api/auth/logout', {}, cookie)).status).toBe(200)
      const after = await session()
      expect(after.status).toBe(401)
      expect(after.headers.get('set-cookie')).toBeNull()
    } finally {
      repository.close()
    }
  })
})
