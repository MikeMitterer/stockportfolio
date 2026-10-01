import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AccountService, hashSetupCode } from '../src/auth/service'
import { createSqliteRepository } from '../src/persistence/repository'
import { createApiRouter } from '../src/routers/api'

const origin = 'http://127.0.0.1:18080'
const directories: string[] = []

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

async function fixture(heartbeatMs?: number) {
  const directory = mkdtempSync(join(tmpdir(), 'stockportfolio-events-'))
  directories.push(directory)
  const repository = createSqliteRepository(join(directory, 'test.sqlite'))
  const service = new AccountService(repository, hashSetupCode('setup-code'))
  const app = createApiRouter(service, repository, {
    publicOrigin: origin,
    secureCookies: false,
    remoteAddress: () => '127.0.0.1',
    heartbeatMs,
  })
  await service.setup('setup-code', 'setup', 'Setup-password-123', '127.0.0.1')
  const login = await service.login('setup', 'Setup-password-123', '127.0.0.1')
  return { app, repository, service, cookie: `stockportfolio_session=${login.token}`, token: login.token }
}

async function readFrame(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const result = await Promise.race([
      reader.read(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Kein SSE-Frame empfangen')), 500)
      }),
    ])
    return new TextDecoder().decode(result.value)
  } finally {
    clearTimeout(timer)
  }
}

describe('private Depotereignisse', () => {
  it('meldet einen gespeicherten Revisionsstand im SSE-Stream desselben Kontos', async () => {
    const { app, repository, cookie } = await fixture()

    const response = await app.request(`${origin}/api/data/events`, {
      headers: { Cookie: cookie },
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/event-stream')
    const reader = response.body!.getReader()
    expect(await readFrame(reader)).toContain(': connected')

    expect((await app.request(`${origin}/api/data/portfolio/depot`, {
      method: 'PUT',
      headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ revision: 0, value: { id: 'depot', name: 'Privat', positions: [] } }),
    })).status).toBe(200)
    const event = await readFrame(reader)
    expect(event).toContain('event: resource')
    expect(event).toContain('"kind":"portfolio","resourceId":"depot","revision":1')
    expect((await app.request(`${origin}/api/data/quote-refresh/current`, {
      method: 'PUT',
      headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ revision: 0, value: { refreshedAt: '2026-09-30T20:00:00.000Z' } }),
    })).status).toBe(200)
    const quoteEvent = await readFrame(reader)
    expect(quoteEvent).toContain('"kind":"quote-refresh","resourceId":"current","revision":1')
    expect(quoteEvent).not.toContain('refreshedAt')
    await reader.cancel()
    repository.close()
  })

  it('meldet das Löschen erst nach erfolgreichem Commit mit neuer Revision', async () => {
    const { app, repository, cookie } = await fixture()
    const headers = { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' }
    expect((await app.request(`${origin}/api/data/portfolio/depot`, {
      method: 'PUT', headers,
      body: JSON.stringify({ revision: 0, value: { id: 'depot', name: 'Privat', positions: [] } }),
    })).status).toBe(200)
    const response = await app.request(`${origin}/api/data/events`, { headers: { Cookie: cookie } })
    const reader = response.body!.getReader()
    await readFrame(reader)

    expect((await app.request(`${origin}/api/data/portfolio/depot`, {
      method: 'DELETE', headers, body: JSON.stringify({ revision: 0 }),
    })).status).toBe(409)
    expect((await app.request(`${origin}/api/data/portfolio/depot`, {
      method: 'DELETE', headers, body: JSON.stringify({ revision: 1 }),
    })).status).toBe(200)
    await expect(readFrame(reader)).resolves.toContain('"kind":"portfolio","resourceId":"depot","revision":2')
    await reader.cancel()
    repository.close()
  })

  it('lässt den internen Kurs-Hinweis nicht löschen, damit seine Revision weiterzählt', async () => {
    const { app, repository, cookie } = await fixture()
    const headers = { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' }
    const announce = async (revision: number) => app.request(`${origin}/api/data/quote-refresh/current`, {
      method: 'PUT', headers,
      body: JSON.stringify({ revision, value: { refreshedAt: new Date().toISOString() } }),
    })
    expect(await (await announce(0)).json()).toEqual({ revision: 1 })
    expect(await (await announce(1)).json()).toEqual({ revision: 2 })

    const response = await app.request(`${origin}/api/data/events`, { headers: { Cookie: cookie } })
    const reader = response.body!.getReader()
    await readFrame(reader)
    const deleted = await app.request(`${origin}/api/data/quote-refresh/current`, {
      method: 'DELETE', headers, body: JSON.stringify({ revision: 2 }),
    })
    expect(deleted.status).toBe(405)
    expect(await deleted.json()).toEqual({ error: 'not_deletable' })

    // Offene Fenster merken sich Revision 2; ein neuer Hinweis muss darüber liegen.
    expect(await (await announce(2)).json()).toEqual({ revision: 3 })
    await expect(readFrame(reader)).resolves.toContain('"kind":"quote-refresh","resourceId":"current","revision":3')
    await reader.cancel()
    repository.close()
  })

  it('sendet keine fremden Depotkennungen und schließt einen abgemeldeten Stream', async () => {
    const { app, repository, service, cookie, token } = await fixture(20)
    await service.createUser('second-user', 'Second-password-123!', 'user')
    const second = await service.login('second-user', 'Second-password-123!', '127.0.0.1')
    const secondToken = await service.changePassword(second.user.id, 'Changed-password-123!')
    const secondResponse = await app.request(`${origin}/api/data/events`, {
      headers: { Cookie: `stockportfolio_session=${secondToken}` },
    })
    const secondReader = secondResponse.body!.getReader()
    expect(await readFrame(secondReader)).toContain(': connected')

    const ownResponse = await app.request(`${origin}/api/data/events`, { headers: { Cookie: cookie } })
    const ownReader = ownResponse.body!.getReader()
    expect(await readFrame(ownReader)).toContain(': connected')
    expect((await app.request(`${origin}/api/data/portfolio/private-depot`, {
      method: 'PUT',
      headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ revision: 0, value: { id: 'private-depot', name: 'Privat', positions: [] } }),
    })).status).toBe(200)
    expect(await readFrame(ownReader)).toContain('private-depot')
    expect(await readFrame(secondReader)).not.toContain('private-depot')

    service.logout(token)
    const next = await ownReader.read()
    expect(next.done).toBe(true)
    await secondReader.cancel()
    repository.close()
  })

  it('meldet nach einem atomaren Restore alle betroffenen Ressourcen ohne Inhalte', async () => {
    const { app, repository, cookie } = await fixture()
    const headers = { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' }
    expect((await app.request(`${origin}/api/data/portfolio/old`, {
      method: 'PUT', headers,
      body: JSON.stringify({ revision: 0, value: { id: 'old', name: 'Altes Depot', positions: [] } }),
    })).status).toBe(200)
    expect((await app.request(`${origin}/api/data/settings/current`, {
      method: 'PUT', headers,
      body: JSON.stringify({ revision: 0, value: { activePortfolioId: 'old' } }),
    })).status).toBe(200)
    const response = await app.request(`${origin}/api/data/events`, { headers: { Cookie: cookie } })
    const reader = response.body!.getReader()
    await readFrame(reader)

    const restored = await app.request(`${origin}/api/data/restore`, {
      method: 'POST', headers,
      body: JSON.stringify({
        portfolio: { id: 'new', name: 'Geheimes Depot', positions: [] },
        settings: { activePortfolioId: 'new' },
        allowlist: { 'isin:secret': false },
        snapshots: [{ date: '2026-09-30', currency: 'EUR', total: 123 }],
        replacedId: 'old',
        revisions: { portfolio: 0, settings: 1, allowlist: 0, snapshots: 0, replaced: 1 },
      }),
    })
    expect(restored.status).toBe(200)
    const frames = await Promise.all(Array.from({ length: 5 }, () => readFrame(reader)))
    const payload = frames.join('')
    expect(payload).toContain('"kind":"portfolio","resourceId":"old","revision":2')
    expect(payload).toContain('"kind":"portfolio","resourceId":"new","revision":1')
    expect(payload).toContain('"kind":"settings","resourceId":"current","revision":2')
    expect(payload).toContain('"kind":"allowlist","resourceId":"new","revision":1')
    expect(payload).toContain('"kind":"snapshots","resourceId":"new","revision":1')
    expect(payload).not.toContain('Geheimes Depot')
    expect(payload).not.toContain('isin:secret')
    await reader.cancel()
    repository.close()
  })

  it('meldet den einmaligen Altimport erst nach dem erfolgreichen Commit', async () => {
    const { app, repository, cookie } = await fixture()
    const response = await app.request(`${origin}/api/data/events`, { headers: { Cookie: cookie } })
    const reader = response.body!.getReader()
    await readFrame(reader)
    const request = {
      method: 'POST',
      headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        portfolios: [{ id: 'legacy', name: 'Altbestand', positions: [] }],
        settings: { activePortfolioId: 'legacy' },
      }),
    }
    expect((await app.request(`${origin}/api/data/legacy-import`, request)).status).toBe(200)
    const frames = await Promise.all(Array.from({ length: 4 }, () => readFrame(reader)))
    const payload = frames.join('')
    for (const kind of ['portfolio', 'allowlist', 'snapshots']) {
      expect(payload).toContain(`"kind":"${kind}","resourceId":"legacy","revision":1`)
    }
    expect(payload).toContain('"kind":"settings","resourceId":"current","revision":1')
    expect(payload).not.toContain('Altbestand')
    expect((await app.request(`${origin}/api/data/legacy-import`, request)).status).toBe(409)
    await reader.cancel()
    repository.close()
  })
})
