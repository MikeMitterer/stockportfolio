import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AccountService, hashSetupCode } from '../src/auth/service'
import { createSqliteRepository } from '../src/persistence/repository'
import { createApiRouter, type ApiOptions } from '../src/routers/api'
import { DEFAULT_SESSION_IDLE_DAYS, parseSessionIdleMs } from '../src/sessionIdle'

const directories: string[] = []
const origin = 'http://127.0.0.1:18080'
const dayMs = 24 * 60 * 60_000

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

/**
 * Angemeldeter Browser: `cookie` folgt wie im Browser jedem `Set-Cookie`,
 * `send` schickt dagegen ein festes, etwa veraltetes Cookie.
 */
async function signedIn(sessionIdleMs?: number, extra: Partial<ApiOptions> = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'stockportfolio-session-'))
  directories.push(directory)
  const repository = createSqliteRepository(join(directory, 'test.sqlite'))
  let currentTime = 100_000
  const service = new AccountService(repository, hashSetupCode('setup-code'), () => currentTime, sessionIdleMs)
  const app = createApiRouter(service, repository, { publicOrigin: origin, secureCookies: false, remoteAddress: () => '10.0.0.1', ...extra })
  let jar = ''
  const remember = (response: Response) => {
    const sessionCookie = response.headers.getSetCookie().find((value) => value.startsWith('stockportfolio_session='))
    if (sessionCookie) jar = sessionCookie.split(';')[0]
    return response
  }
  const post = async (path: string, body: unknown, cookie = jar) => remember(await app.request(`${origin}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  }))
  const send = (cookie: string) => app.request(`${origin}/api/auth/session`, { headers: { Cookie: cookie } })
  await post('/api/setup', { code: 'setup-code', username: 'mike', password: 'Test-password-123' })
  const login = await post('/api/auth/login', { username: 'mike', password: 'Test-password-123' })
  return {
    repository,
    service,
    loginCookie: login.headers.get('set-cookie') ?? '',
    cookie: () => jar,
    post,
    send,
    session: async () => remember(await send(jar)),
    proxy: async (path: string) => remember(await app.request(`${origin}/api/stockinfo${path}`, { headers: { Cookie: jar } })),
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
    const { repository, cookie, post, send } = await signedIn()
    try {
      const before = cookie()
      const changed = await post('/api/auth/change-password', { password: 'Changed-password-123' })
      expect(changed.status).toBe(200)
      const sessionCookies = changed.headers.getSetCookie().filter((value) => value.startsWith('stockportfolio_session='))
      expect(sessionCookies).toHaveLength(1)
      expect(cookie()).not.toBe(before)
      expect((await send(before)).status).toBe(401)
    } finally {
      repository.close()
    }
  })

  it('verlängert eine ungültige Sitzung nicht und beendet sie beim Abmelden sofort', async () => {
    const { repository, post, session } = await signedIn()
    try {
      expect((await post('/api/auth/logout', {})).status).toBe(200)
      const after = await session()
      expect(after.status).toBe(401)
      expect(after.headers.get('set-cookie')).toBeNull()
    } finally {
      repository.close()
    }
  })
})

describe('Token-Tausch (T-98)', () => {
  it('tauscht ein Token, das älter als einen Tag ist, und lässt das alte noch 60 s gelten', async () => {
    const { repository, cookie, session, send, advance } = await signedIn()
    try {
      const original = cookie()
      advance(dayMs - 1)
      await session()
      expect(cookie()).toBe(original)
      advance(1)
      expect((await session()).status).toBe(200)
      const successor = cookie()
      expect(successor).not.toBe(original)
      advance(60_000 - 1)
      expect((await send(original)).status).toBe(200)
      advance(1)
      expect((await send(original)).status).toBe(401)
      expect((await send(successor)).status).toBe(200)
    } finally {
      repository.close()
    }
  })

  it('setzt mit einem ersetzten Token kein Cookie und tauscht nicht erneut', async () => {
    const { repository, cookie, session, send, advance } = await signedIn()
    try {
      const original = cookie()
      advance(dayMs)
      await session()
      const successor = cookie()
      const late = await send(original)
      expect(late.status).toBe(200)
      expect(late.headers.getSetCookie()).toEqual([])
      expect((await send(successor)).headers.getSetCookie()[0].split(';')[0]).toBe(successor)
    } finally {
      repository.close()
    }
  })

  it('meldet auch ohne tägliche Nutzung nur nach der Leerlauffrist ab', async () => {
    const { repository, cookie, session, advance } = await signedIn()
    try {
      const seen = new Set([cookie()])
      for (let visit = 0; visit < 6; visit++) {
        advance(5 * dayMs)
        expect((await session()).status).toBe(200)
        seen.add(cookie())
      }
      expect(seen.size).toBe(7)
      advance(7 * dayMs)
      expect((await session()).status).toBe(401)
    } finally {
      repository.close()
    }
  })

  it('räumt ersetzte Sitzungen nach der Übergangsfrist beim nächsten Tausch weg', async () => {
    const { repository, cookie, session, advance } = await signedIn()
    try {
      const original = cookie().split('=')[1]
      advance(dayMs)
      await session()
      expect(repository.findSession(hashSetupCode(original))?.replacedAt).not.toBeNull()
      advance(dayMs)
      await session()
      expect(repository.findSession(hashSetupCode(original))).toBeNull()
    } finally {
      repository.close()
    }
  })

  it('tauscht nicht in einer offenen Ereignisverbindung, die kein Cookie mehr setzen kann', async () => {
    const { repository, service, cookie, advance } = await signedIn()
    try {
      const original = cookie().split('=')[1]
      advance(dayMs)
      expect(service.session(original).username).toBe('mike')
      expect(repository.findSession(hashSetupCode(original))?.replacedAt ?? null).toBeNull()
    } finally {
      repository.close()
    }
  })

  it('beendet beim Abmelden mit dem neuen Token auch das alte in der Übergangsfrist (R1-F1)', async () => {
    const { repository, cookie, post, session, send, advance } = await signedIn()
    try {
      const original = cookie()
      advance(dayMs)
      await session()
      const successor = cookie()
      expect(successor).not.toBe(original)
      expect((await post('/api/auth/logout', {}, successor)).status).toBe(200)
      expect((await send(original)).status).toBe(401)
      expect((await send(successor)).status).toBe(401)
    } finally {
      repository.close()
    }
  })

  it('beendet beim Abmelden mit dem alten Token auch den Nachfolger (R1-F1)', async () => {
    const { repository, cookie, post, session, send, advance } = await signedIn()
    try {
      const original = cookie()
      advance(dayMs)
      await session()
      const successor = cookie()
      expect((await post('/api/auth/logout', {}, original)).status).toBe(200)
      expect((await send(successor)).status).toBe(401)
      expect((await send(original)).status).toBe(401)
    } finally {
      repository.close()
    }
  })

  it('lässt die Abmeldung anderer Browser desselben Kontos unberührt', async () => {
    const { repository, cookie, post, send } = await signedIn()
    try {
      const first = cookie()
      await post('/api/auth/login', { username: 'mike', password: 'Test-password-123' })
      const second = cookie()
      expect(second).not.toBe(first)
      expect((await post('/api/auth/logout', {}, second)).status).toBe(200)
      expect((await send(first)).status).toBe(200)
    } finally {
      repository.close()
    }
  })
})

describe('Ereignisverbindung und Leerlauffrist (R1-F2)', () => {
  it('verlängert die Sitzung beim Prüfen der offenen Verbindung nicht', async () => {
    const { repository, service, cookie, session, advance } = await signedIn()
    try {
      const token = cookie().split('=')[1]
      for (let check = 0; check < 6; check++) {
        advance(dayMs)
        expect(service.isActive(token)).toBe(true)
      }
      advance(dayMs)
      expect(service.isActive(token)).toBe(false)
      expect((await session()).status).toBe(401)
    } finally {
      repository.close()
    }
  })
})

describe('Cookie beim Token-Tausch (Runde 2)', () => {
  it('liefert über die StockInfo-Weiterleitung das neue Cookie, nie eines von StockInfo (R1-F1)', async () => {
    const upstream = vi.fn(async () => new Response('{"status":"ok"}', {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'stockinfo=fremd; Path=/' },
    }))
    const { repository, cookie, advance, proxy, send } = await signedIn(undefined, {
      stockInfoUrl: 'http://stockinfo.test',
      stockInfoFetch: upstream,
    })
    try {
      const before = cookie()
      advance(dayMs + 1_000)
      const response = await proxy('/health')
      expect(response.status).toBe(200)
      const setCookies = response.headers.getSetCookie()
      expect(setCookies.some((value) => value.startsWith('stockinfo='))).toBe(false)
      expect(cookie()).not.toBe(before)
      advance(61_000)
      expect((await send(cookie())).status).toBe(200)
      expect((await send(before)).status).toBe(401)
    } finally {
      repository.close()
    }
  })

  it('lässt eine langsamere ältere Antwort das getauschte Cookie nicht zurücksetzen (R1-F2)', async () => {
    const { repository, cookie, advance, post, session } = await signedIn()
    try {
      const before = cookie()
      advance(dayMs - 1_000)
      // Die langsame Anfrage prüft die Sitzung noch vor der Tauschgrenze und hasht dann ein Kennwort.
      const slow = post('/api/admin/users', { username: 'anna', password: 'Test-password-456', role: 'user' }, before)
      await new Promise((resolve) => setImmediate(resolve))
      advance(2_000)
      expect((await session()).status).toBe(200)
      const rotated = cookie()
      expect(rotated).not.toBe(before)
      expect((await slow).status).toBe(201)
      expect(cookie()).toBe(rotated)
      advance(61_000)
      expect((await session()).status).toBe(200)
    } finally {
      repository.close()
    }
  })
})

describe('Übergangsfrist und Abmeldung (Runde 3)', () => {
  it('verbraucht die Übergangsfrist nicht während einer langen Anfrage (R2-F1)', async () => {
    const { repository, cookie, advance, post, session } = await signedIn()
    try {
      const before = cookie()
      advance(dayMs + 1_000)
      // Die erste Anfrage nach der Tauschgrenze dauert länger als die 60-s-Übergangsfrist.
      const slow = post('/api/admin/users', { username: 'anna', password: 'Test-password-456', role: 'user' }, before)
      await new Promise((resolve) => setImmediate(resolve))
      advance(61_000)
      // Der Browser hat noch kein neues Cookie; eine parallele Anfrage muss mit dem alten durchgehen.
      expect((await session()).status).toBe(200)
      expect((await slow).status).toBe(201)
      expect((await session()).status).toBe(200)
    } finally {
      repository.close()
    }
  })

  it('widerruft die Sitzung nicht mit einem abgelaufenen Vorgänger (R2-F2)', async () => {
    const { repository, cookie, advance, post, send, session } = await signedIn()
    try {
      const before = cookie()
      advance(dayMs + 1_000)
      expect((await session()).status).toBe(200)
      const rotated = cookie()
      expect(rotated).not.toBe(before)
      advance(61_000)
      // Abmelden mit dem alten Token, etwa aus einer Kopie; der Browser behält das neue.
      await post('/api/auth/logout', {}, before)
      expect((await send(rotated)).status).toBe(200)
    } finally {
      repository.close()
    }
  })

  it('beendet mit einem gültigen Vorgänger in der Übergangsfrist weiter beide Tokens (R2-F2)', async () => {
    const { repository, cookie, advance, post, send, session } = await signedIn()
    try {
      const before = cookie()
      advance(dayMs + 1_000)
      expect((await session()).status).toBe(200)
      const rotated = cookie()
      advance(30_000)
      await post('/api/auth/logout', {}, before)
      expect((await send(rotated)).status).toBe(401)
      expect((await send(before)).status).toBe(401)
    } finally {
      repository.close()
    }
  })
})

