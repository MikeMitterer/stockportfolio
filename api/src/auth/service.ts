import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import argon2 from 'argon2'
import type { AccountRepository, UserRecord } from '../persistence/repository.js'

const idleLimitMs = 12 * 60 * 60_000
const absoluteLimitMs = 7 * 24 * 60 * 60_000
// Gleiche Argon2id-Parameter wie bei echten Konten, damit unbekannte Namen keinen kürzeren Login-Pfad haben.
const placeholderPasswordHash = '$argon2id$v=19$m=65536,p=4,t=3$I2q0ZM23ZTSD1i05A5Gxuw$kVyn3VeN0V2F2B2rwTwUX465a4odogCqqZOBLu2+XbM'

export class ServiceError extends Error {
  constructor(public readonly status: number, public readonly code: string, public readonly retryAfter?: number) {
    super(code)
  }
}

export interface PublicUser {
  id: string
  username: string
  role: 'admin' | 'user'
  active: boolean
  mustChangePassword: boolean
  isSetupAccount: boolean
  legacyImported: boolean
}

export function publicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    active: user.active,
    mustChangePassword: user.mustChangePassword,
    isSetupAccount: user.isSetupAccount,
    legacyImported: user.legacyImported,
  }
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function hashSetupCode(code: string): string {
  return digest(code)
}

function sameDigest(first: string, second: string): boolean {
  const firstBytes = Buffer.from(first, 'hex')
  const secondBytes = Buffer.from(second, 'hex')
  return firstBytes.length === secondBytes.length && timingSafeEqual(firstBytes, secondBytes)
}

function normalizeUsername(username: string): string {
  const normalized = username.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(normalized)) {
    throw new ServiceError(400, 'invalid_username')
  }
  return normalized
}

function validatePassword(password: string): void {
  if (
    password.length < 12 || password.length > 1024 ||
    !/\p{Lu}/u.test(password) ||
    !/\p{Nd}/u.test(password) ||
    !/[\p{P}\p{S}]/u.test(password)
  ) {
    throw new ServiceError(400, 'invalid_password')
  }
}

export class AccountService {
  constructor(
    private readonly repository: AccountRepository,
    private setupCodeHash: string | null,
    private readonly now: () => number = Date.now,
  ) {}

  setupRequired(): boolean {
    return !this.repository.hasAdmin()
  }

  private rateKey(kind: string, username: string, address: string): string {
    return digest(`${kind}\0${username}\0${address}`)
  }

  private checkLimit(key: string): void {
    const attempt = this.repository.getAttempt(key)
    if (attempt?.blockedUntil && attempt.blockedUntil > this.now()) {
      throw new ServiceError(429, 'rate_limited', Math.ceil((attempt.blockedUntil - this.now()) / 1000))
    }
  }

  private failAttempt(key: string): never {
    const attempt = this.repository.recordFailure(key, this.now())
    if (attempt.blockedUntil) {
      throw new ServiceError(429, 'rate_limited', Math.ceil((attempt.blockedUntil - this.now()) / 1000))
    }
    throw new ServiceError(401, 'invalid_credentials')
  }

  async setup(code: string, username: string, password: string, address: string): Promise<PublicUser> {
    if (!this.setupRequired()) throw new ServiceError(409, 'setup_closed')
    const key = this.rateKey('setup', '', address)
    this.checkLimit(key)
    if (!this.setupCodeHash || !sameDigest(hashSetupCode(code), this.setupCodeHash)) this.failAttempt(key)
    const normalized = normalizeUsername(username)
    validatePassword(password)
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id })
    const user = this.repository.createFirstAdmin(normalized, passwordHash, this.now())
    if (!user) throw new ServiceError(409, 'setup_closed')
    this.setupCodeHash = null
    this.repository.clearFailures(key)
    return publicUser(user)
  }

  async login(username: string, password: string, address: string): Promise<{ user: PublicUser; token: string }> {
    const normalized = username.trim().toLowerCase()
    const key = this.rateKey('login', normalized, address)
    this.checkLimit(key)
    const user = this.repository.findUserByName(normalized)
    const passwordHash = user?.active ? user.passwordHash : placeholderPasswordHash
    const passwordValid = await argon2.verify(passwordHash, password)
    if (!user?.active || !passwordValid) this.failAttempt(key)
    this.repository.clearFailures(key)
    return { user: publicUser(user), token: this.issueSession(user.id) }
  }

  private issueSession(userId: string): string {
    const token = randomBytes(32).toString('hex')
    const now = this.now()
    this.repository.createSession({ tokenHash: digest(token), userId, createdAt: now, lastSeenAt: now })
    return token
  }

  session(token: string): PublicUser {
    const tokenHash = digest(token)
    const session = this.repository.findSession(tokenHash)
    if (!session) throw new ServiceError(401, 'unauthorized')
    const now = this.now()
    if (now - session.lastSeenAt >= idleLimitMs || now - session.createdAt >= absoluteLimitMs) {
      this.repository.deleteSession(tokenHash)
      throw new ServiceError(401, 'unauthorized')
    }
    const user = this.repository.findUserById(session.userId)
    if (!user?.active) {
      this.repository.deleteSession(tokenHash)
      throw new ServiceError(401, 'unauthorized')
    }
    this.repository.touchSession(tokenHash, now)
    return publicUser(user)
  }

  logout(token: string): void {
    this.repository.deleteSession(digest(token))
  }

  async changePassword(userId: string, password: string): Promise<string> {
    validatePassword(password)
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id })
    if (!this.repository.replacePassword(userId, passwordHash, false)) throw new ServiceError(404, 'user_not_found')
    return this.issueSession(userId)
  }

  listUsers(): PublicUser[] {
    return this.repository.listUsers().map(publicUser)
  }

  async createUser(username: string, password: string, role: 'admin' | 'user'): Promise<PublicUser> {
    const normalized = normalizeUsername(username)
    validatePassword(password)
    if (this.repository.findUserByName(normalized)) throw new ServiceError(409, 'username_taken')
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id })
    try {
      return publicUser(this.repository.createUser(normalized, passwordHash, role, this.now()))
    } catch (cause) {
      if (this.repository.findUserByName(normalized)) throw new ServiceError(409, 'username_taken')
      throw cause
    }
  }

  async resetPassword(userId: string, password: string): Promise<void> {
    validatePassword(password)
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id })
    if (!this.repository.replacePassword(userId, passwordHash, true)) throw new ServiceError(404, 'user_not_found')
  }

  deactivateUser(userId: string): void {
    const result = this.repository.deactivateUser(userId)
    if (result === 'last_admin') throw new ServiceError(409, 'last_admin')
    if (result === 'not_found') throw new ServiceError(404, 'user_not_found')
  }

  reactivateUser(userId: string): void {
    if (!this.repository.reactivateUser(userId)) throw new ServiceError(404, 'user_not_found')
  }
}
