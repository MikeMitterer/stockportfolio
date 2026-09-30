import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createSqliteRepository } from '../src/persistence/repository'
import { AccountService, hashSetupCode } from '../src/auth/service'
import { createApiRouter } from '../src/routers/api'

const origin = 'http://127.0.0.1:18080'
const directories: string[] = []

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

async function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'stockportfolio-data-'))
  directories.push(directory)
  const repository = createSqliteRepository(join(directory, 'test.sqlite'))
  const service = new AccountService(repository, hashSetupCode('setup-code'))
  const app = createApiRouter(service, repository, { publicOrigin: origin, secureCookies: false, remoteAddress: () => '127.0.0.1' })
  await service.setup('setup-code', 'setup', 'Setup-password-123', '127.0.0.1')
  const secondUser = await service.createUser('second', 'Second-password-123', 'admin')
  await service.changePassword(secondUser.id, 'Second-password-123')
  const setup = await service.login('setup', 'Setup-password-123', '127.0.0.1')
  const second = await service.login('second', 'Second-password-123', '127.0.0.1')
  return {
    app,
    repository,
    setupCookie: `stockportfolio_session=${setup.token}`,
    secondCookie: `stockportfolio_session=${second.token}`,
  }
}

function request(method: string, cookie: string, value?: object) {
  return {
    method,
    headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' },
    ...(value ? { body: JSON.stringify(value) } : {}),
  }
}

describe('private Depotdaten', () => {
  it('trennt Depots auch zwischen zwei Admins und weist veraltete Revisionen ab', async () => {
    const { app, repository, setupCookie, secondCookie } = await fixture()
    const id = 'portfolio-one'
    const first = await app.request(`${origin}/api/data/portfolio/${id}`, request('PUT', setupCookie, {
      revision: 0, value: { id, name: 'Privat', positions: [] },
    }))
    expect(first.status).toBe(200)
    expect((await first.json()).revision).toBe(1)
    expect((await app.request(`${origin}/api/data/portfolio/${id}`, request('GET', secondCookie))).status).toBe(404)
    expect((await app.request(`${origin}/api/data/portfolio/${id}`, request('PUT', secondCookie, {
      revision: 1, value: { id, name: 'Fremd', positions: [] },
    }))).status).toBe(409)
    expect((await app.request(`${origin}/api/data/portfolio/${id}`, request('PUT', secondCookie, {
      revision: 0, value: { id, name: 'Eigenes Depot B', positions: [] },
    }))).status).toBe(200)
    expect((await app.request(`${origin}/api/data/portfolio/${id}`, request('DELETE', secondCookie, { revision: 1 }))).status).toBe(200)
    expect((await app.request(`${origin}/api/data/portfolio/${id}`, request('PUT', setupCookie, {
      revision: 0, value: { id, name: 'Alt', positions: [] },
    }))).status).toBe(409)
    expect((await (await app.request(`${origin}/api/data/portfolio/${id}`, request('GET', setupCookie))).json()).value.name).toBe('Privat')
    repository.close()
  })

  it('erlaubt den Altimport nur einmal dem Setup-Konto und schreibt Marker mit Daten atomar', async () => {
    const { app, repository, setupCookie, secondCookie } = await fixture()
    const payload = { portfolios: [{ id: 'legacy-one', name: 'Alt', positions: [] }], settings: { activePortfolioId: 'legacy-one' } }
    expect((await app.request(`${origin}/api/data/portfolio/legacy-one`, request('PUT', secondCookie, {
      revision: 0, value: { id: 'legacy-one', name: 'Depot B', positions: [] },
    }))).status).toBe(200)
    expect((await app.request(`${origin}/api/data/legacy-import`, request('POST', secondCookie, payload))).status).toBe(403)
    expect((await app.request(`${origin}/api/data/legacy-import`, request('POST', setupCookie, payload))).status).toBe(200)
    expect((await app.request(`${origin}/api/data/legacy-import`, request('POST', setupCookie, payload))).status).toBe(409)
    expect((await (await app.request(`${origin}/api/auth/session`, request('GET', setupCookie))).json()).user.legacyImported).toBe(true)
    expect((await (await app.request(`${origin}/api/data/portfolio/legacy-one`, request('GET', secondCookie))).json()).value.name).toBe('Depot B')
    expect((await (await app.request(`${origin}/api/data/portfolio/legacy-one`, request('GET', setupCookie))).json()).value.name).toBe('Alt')
    repository.close()
  })

  it('stellt dieselbe Backup-Datei in zwei Konten getrennt wieder her', async () => {
    const { app, repository, setupCookie, secondCookie } = await fixture()
    const id = 'shared-backup-id'
    const backup = {
      portfolio: { id, name: 'Gleiche Datei', positions: [] },
      settings: { activePortfolioId: id },
      allowlist: {},
      snapshots: [],
      replacedId: null,
      revisions: { portfolio: 0, settings: 0, allowlist: 0, snapshots: 0, replaced: null },
    }
    expect((await app.request(`${origin}/api/data/restore`, request('POST', setupCookie, backup))).status).toBe(200)
    expect((await app.request(`${origin}/api/data/restore`, request('POST', secondCookie, backup))).status).toBe(200)
    expect((await app.request(`${origin}/api/data/portfolio/${id}`, request('PUT', secondCookie, {
      revision: 1, value: { id, name: 'Kopie B', positions: [] },
    }))).status).toBe(200)
    expect((await (await app.request(`${origin}/api/data/portfolio/${id}`, request('GET', setupCookie))).json()).value.name).toBe('Gleiche Datei')
    expect((await (await app.request(`${origin}/api/data/portfolio/${id}`, request('GET', secondCookie))).json()).value.name).toBe('Kopie B')
    repository.close()
  })

  it('trennt Einstellungen, Instrumentauswahl und Tageswerte vom zweiten Konto', async () => {
    const { app, repository, setupCookie, secondCookie } = await fixture()
    const id = 'private-portfolio'
    await app.request(`${origin}/api/data/portfolio/${id}`, request('PUT', setupCookie, {
      revision: 0, value: { id, name: 'Privat', positions: [] },
    }))
    for (const [kind, resourceId, value] of [
      ['settings', 'current', { activePortfolioId: id }],
      ['allowlist', id, { 'isin:private': false }],
      ['snapshots', id, [{ date: '2026-09-30', currency: 'EUR', total: 100 }]],
    ] as const) {
      expect((await app.request(`${origin}/api/data/${kind}/${resourceId}`, request('PUT', setupCookie, { revision: 0, value }))).status).toBe(200)
      expect((await app.request(`${origin}/api/data/${kind}/${resourceId}`, request('GET', secondCookie))).status).toBe(404)
      expect((await app.request(`${origin}/api/data/${kind}/${resourceId}`, request('PUT', secondCookie, { revision: 0, value }))).status).not.toBe(200)
    }
    expect((await app.request(`${origin}/api/data/allowlist/${id}`, request('DELETE', secondCookie, { revision: 1 }))).status).toBe(404)
    repository.close()
  })

  it('spielt ein Backup atomar ein und schützt dabei Depot und Einstellungen vor veralteten Ständen', async () => {
    const { app, repository, setupCookie, secondCookie } = await fixture()
    const oldId = 'old-portfolio'
    await app.request(`${origin}/api/data/portfolio/${oldId}`, request('PUT', setupCookie, {
      revision: 0, value: { id: oldId, name: 'Alt', positions: [] },
    }))
    await app.request(`${origin}/api/data/settings/current`, request('PUT', setupCookie, {
      revision: 0, value: { activePortfolioId: oldId },
    }))
    const backup = {
      portfolio: { id: 'restored-portfolio', name: 'Neu', positions: [] },
      settings: { activePortfolioId: 'restored-portfolio' },
      allowlist: { 'isin:one': false },
      snapshots: [{ date: '2026-09-30', currency: 'EUR', total: 123 }],
      replacedId: oldId,
      revisions: { portfolio: 0, settings: 1, allowlist: 0, snapshots: 0, replaced: 1 },
    }

    expect((await app.request(`${origin}/api/data/restore`, request('POST', secondCookie, backup))).status).toBe(404)
    expect((await app.request(`${origin}/api/data/restore`, request('POST', setupCookie, {
      ...backup, revisions: { ...backup.revisions, settings: 0 },
    }))).status).toBe(409)
    expect((await (await app.request(`${origin}/api/data/portfolio/${oldId}`, request('GET', setupCookie))).json()).value.name).toBe('Alt')

    expect((await app.request(`${origin}/api/data/restore`, request('POST', setupCookie, backup))).status).toBe(200)
    expect((await app.request(`${origin}/api/data/portfolio/${oldId}`, request('GET', setupCookie))).status).toBe(404)
    expect((await (await app.request(`${origin}/api/data/portfolio/restored-portfolio`, request('GET', setupCookie))).json()).value.name).toBe('Neu')
    expect((await (await app.request(`${origin}/api/data/allowlist/restored-portfolio`, request('GET', setupCookie))).json()).value['isin:one']).toBe(false)
    expect((await (await app.request(`${origin}/api/data/settings/current`, request('GET', setupCookie))).json()).value.activePortfolioId).toBe('restored-portfolio')
    repository.close()
  })
})
