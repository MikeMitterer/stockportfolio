import { afterEach, describe, expect, it, vi } from 'vitest'
import argon2 from 'argon2'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createSqliteRepository } from '../src/persistence/repository'
import { AccountService, hashSetupCode } from '../src/auth/service'
import { createApiRouter } from '../src/routers/api'

const directories: string[] = []
const origin = 'http://127.0.0.1:18080'

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

function createFixture() {
  const directory = mkdtempSync(join(tmpdir(), 'stockportfolio-api-'))
  directories.push(directory)
  const repository = createSqliteRepository(join(directory, 'test.sqlite'))
  let currentTime = 100_000
  const service = new AccountService(repository, hashSetupCode('setup-code'), () => currentTime)
  const app = createApiRouter(service, repository, { publicOrigin: origin, secureCookies: false, remoteAddress: () => '10.0.0.1' })
  return { app, repository, service, advance: (milliseconds: number) => { currentTime += milliseconds } }
}

function jsonRequest(body: unknown, cookie?: string, requestOrigin = origin) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: requestOrigin, ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  }
}

describe('eigene Konto-API', () => {
  it('verlangt bei neuen Passwörtern Länge, Großbuchstaben, Ziffer und Sonderzeichen', async () => {
    const { service, repository } = createFixture()
    const invalidPasswords = [
      'Short1!',
      'lowercase!12345',
      'NoDigitsHere!',
      'NoSymbol12345',
      `Valid1!${'a'.repeat(1020)}`,
    ]

    try {
      for (const password of invalidPasswords) {
        await expect(service.setup('setup-code', 'mike', password, '10.0.0.1'))
          .rejects.toMatchObject({ status: 400, code: 'invalid_password' })
      }

      const admin = await service.setup('setup-code', 'mike', 'Äbcdefghij1!', '10.0.0.1')
      await expect(service.createUser('guest', 'NoSymbol12345', 'user'))
        .rejects.toMatchObject({ status: 400, code: 'invalid_password' })
      const guest = await service.createUser('guest', 'Guest-password-123', 'user')
      await expect(service.resetPassword(guest.id, 'NoDigitsHere!'))
        .rejects.toMatchObject({ status: 400, code: 'invalid_password' })
      await expect(service.changePassword(admin.id, 'lowercase!12345'))
        .rejects.toMatchObject({ status: 400, code: 'invalid_password' })
    } finally {
      repository.close()
    }
  })

  it('erlaubt Setup nur einmal und schützt den Login mit einem HttpOnly-Cookie', async () => {
    const { app, repository } = createFixture()
    expect((await (await app.request(`${origin}/api/setup/status`)).json()).required).toBe(true)

    const setup = await app.request(`${origin}/api/setup`, jsonRequest({ code: 'setup-code', username: 'Mike', password: 'Test-password-123' }))
    expect(setup.status).toBe(201)
    expect((await app.request(`${origin}/api/setup`, jsonRequest({ code: 'setup-code', username: 'other', password: 'Test-password-123' }))).status).toBe(409)

    const login = await app.request(`${origin}/api/auth/login`, jsonRequest({ username: 'mike', password: 'Test-password-123' }))
    expect(login.status).toBe(200)
    const cookie = login.headers.get('set-cookie') ?? ''
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    const session = await app.request(`${origin}/api/auth/session`, { headers: { Cookie: cookie } })
    expect((await session.json()).user.username).toBe('mike')
    expect(repository.findUserByName('mike')?.passwordHash).not.toBe('Test-password-123')
    repository.close()
  })

  it('weist fremde Herkunft und normale Nutzer auf Admin-Routen ab', async () => {
    const { app, repository } = createFixture()
    expect((await app.request(`${origin}/api/setup`, jsonRequest({ code: 'setup-code', username: 'mike', password: 'Test-password-123' }, undefined, 'https://foreign.example'))).status).toBe(403)
    await app.request(`${origin}/api/setup`, jsonRequest({ code: 'setup-code', username: 'mike', password: 'Test-password-123' }))
    const adminLogin = await app.request(`${origin}/api/auth/login`, jsonRequest({ username: 'mike', password: 'Test-password-123' }))
    const adminCookie = adminLogin.headers.get('set-cookie') ?? ''
    const created = await app.request(`${origin}/api/admin/users`, jsonRequest({ username: 'guest', password: 'Guest-password-123', role: 'user' }, adminCookie))
    expect(created.status).toBe(201)
    const guestLogin = await app.request(`${origin}/api/auth/login`, jsonRequest({ username: 'guest', password: 'Guest-password-123' }))
    const guestCookie = guestLogin.headers.get('set-cookie') ?? ''
    expect((await app.request(`${origin}/api/admin/users`, { headers: { Cookie: guestCookie } })).status).toBe(403)
    expect((await app.request(`${origin}/api/admin/users`)).status).toBe(401)
    repository.close()
  })

  it('widerruft nach Reset Sitzungen und schützt den letzten aktiven Admin', async () => {
    const { app, repository } = createFixture()
    await app.request(`${origin}/api/setup`, jsonRequest({ code: 'setup-code', username: 'mike', password: 'Test-password-123' }))
    const login = await app.request(`${origin}/api/auth/login`, jsonRequest({ username: 'mike', password: 'Test-password-123' }))
    const adminCookie = login.headers.get('set-cookie') ?? ''
    const adminId = repository.findUserByName('mike')?.id
    expect((await app.request(`${origin}/api/admin/users/${adminId}/deactivate`, jsonRequest({}, adminCookie))).status).toBe(409)
    const userResponse = await app.request(`${origin}/api/admin/users`, jsonRequest({ username: 'guest', password: 'Guest-password-123', role: 'user' }, adminCookie))
    const guestId = (await userResponse.json()).user.id
    const guestLogin = await app.request(`${origin}/api/auth/login`, jsonRequest({ username: 'guest', password: 'Guest-password-123' }))
    const guestCookie = guestLogin.headers.get('set-cookie') ?? ''
    const reset = await app.request(`${origin}/api/admin/users/${guestId}/reset-password`, jsonRequest({ password: 'New-password-123' }, adminCookie))
    expect(reset.status).toBe(200)
    expect((await app.request(`${origin}/api/auth/session`, { headers: { Cookie: guestCookie } })).status).toBe(401)
    const temporaryLogin = await app.request(`${origin}/api/auth/login`, jsonRequest({ username: 'guest', password: 'New-password-123' }))
    expect((await temporaryLogin.json()).user.mustChangePassword).toBe(true)
    const temporaryCookie = temporaryLogin.headers.get('set-cookie') ?? ''
    const changed = await app.request(`${origin}/api/auth/change-password`, jsonRequest({ password: 'Changed-password-123' }, temporaryCookie))
    expect(changed.status).toBe(200)
    expect((await changed.json()).user.mustChangePassword).toBe(false)
    expect((await app.request(`${origin}/api/auth/session`, { headers: { Cookie: temporaryCookie } })).status).toBe(401)
    const changedCookie = changed.headers.get('set-cookie') ?? ''
    expect((await app.request(`${origin}/api/auth/session`, { headers: { Cookie: changedCookie } })).status).toBe(200)
    expect((await app.request(`${origin}/api/admin/users/${guestId}/deactivate`, jsonRequest({}, adminCookie))).status).toBe(200)
    expect((await app.request(`${origin}/api/auth/session`, { headers: { Cookie: changedCookie } })).status).toBe(401)
    expect((await app.request(`${origin}/api/auth/logout`, jsonRequest({}, adminCookie))).status).toBe(200)
    expect((await app.request(`${origin}/api/auth/session`, { headers: { Cookie: adminCookie } })).status).toBe(401)
    repository.close()
  })

  it('begrenzt Fehlversuche für ein Konto ohne ein anderes Konto derselben IP zu sperren', async () => {
    const { app, repository } = createFixture()
    await app.request(`${origin}/api/setup`, jsonRequest({ code: 'setup-code', username: 'mike', password: 'Test-password-123' }))
    const adminLogin = await app.request(`${origin}/api/auth/login`, jsonRequest({ username: 'mike', password: 'Test-password-123' }))
    const adminCookie = adminLogin.headers.get('set-cookie') ?? ''
    expect((await app.request(`${origin}/api/admin/users`, jsonRequest({ username: 'other', password: 'Other-password-123', role: 'user' }, adminCookie))).status).toBe(201)
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await app.request(`${origin}/api/auth/login`, jsonRequest({ username: 'mike', password: 'wrong-password' }))
    }
    const blocked = await app.request(`${origin}/api/auth/login`, jsonRequest({ username: 'mike', password: 'Test-password-123' }))
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('retry-after')).toBeTruthy()
    const other = await app.request(`${origin}/api/auth/login`, jsonRequest({ username: 'other', password: 'Other-password-123' }))
    expect(other.status).toBe(200)
    repository.close()
  })

  it('prüft Passwörter auch bei unbekannten und inaktiven Konten mit Argon2id', async () => {
    const { service, repository } = createFixture()
    await service.setup('setup-code', 'mike', 'Test-password-123', '10.0.0.1')
    const inactive = await service.createUser('inactive', 'Inactive-password-123', 'user')
    service.deactivateUser(inactive.id)
    const verify = vi.spyOn(argon2, 'verify')
    const hashes = new Map<string, string>()

    try {
      for (const username of ['mike', 'missing', 'inactive']) {
        verify.mockClear()
        await expect(service.login(username, 'wrong-password', '10.0.0.1')).rejects.toMatchObject({
          status: 401,
          code: 'invalid_credentials',
        })
        expect(verify, username).toHaveBeenCalledTimes(1)
        hashes.set(username, verify.mock.calls[0]?.[0] ?? '')
      }

      const activeHash = repository.findUserByName('mike')?.passwordHash ?? ''
      expect(hashes.get('mike')).toBe(activeHash)
      for (const username of ['missing', 'inactive']) {
        const fallbackHash = hashes.get(username) ?? ''
        expect(fallbackHash).not.toBe(activeHash)
        expect(fallbackHash.split('$').slice(0, 4)).toEqual(activeHash.split('$').slice(0, 4))
      }
    } finally {
      verify.mockRestore()
      repository.close()
    }
  })
})
