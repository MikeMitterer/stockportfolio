import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { loginAttempts, sessions, users } from './schema.js'

export interface UserRecord {
  id: string
  username: string
  passwordHash: string
  role: 'admin' | 'user'
  active: boolean
  mustChangePassword: boolean
  createdAt: number
}

export interface SessionRecord {
  tokenHash: string
  userId: string
  createdAt: number
  lastSeenAt: number
}

export interface AttemptRecord {
  key: string
  firstFailedAt: number
  failureCount: number
  blockedUntil: number | null
}

export interface AccountRepository {
  readonly filePath: string
  hasAdmin(): boolean
  createFirstAdmin(username: string, passwordHash: string, now: number): UserRecord | null
  findUserByName(username: string): UserRecord | null
  findUserById(id: string): UserRecord | null
  listUsers(): UserRecord[]
  createUser(username: string, passwordHash: string, role: 'admin' | 'user', now: number): UserRecord
  replacePassword(id: string, passwordHash: string, mustChangePassword: boolean): boolean
  deactivateUser(id: string): 'done' | 'last_admin' | 'not_found'
  createSession(record: SessionRecord): void
  findSession(tokenHash: string): SessionRecord | null
  touchSession(tokenHash: string, now: number): void
  deleteSession(tokenHash: string): void
  deleteUserSessions(userId: string): void
  getAttempt(key: string): AttemptRecord | null
  recordFailure(key: string, now: number): AttemptRecord
  clearFailures(key: string): void
  close(): void
}

export function createSqliteRepository(filePath: string): AccountRepository {
  const resolvedPath = resolve(filePath)
  mkdirSync(dirname(resolvedPath), { recursive: true })
  const connection = new Database(resolvedPath)
  connection.pragma('foreign_keys = ON')
  connection.pragma('journal_mode = WAL')
  connection.pragma('busy_timeout = 5000')
  const database = drizzle({ client: connection })
  migrate(database, { migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)) })

  function findUserById(id: string): UserRecord | null {
    return database.select().from(users).where(eq(users.id, id)).get() ?? null
  }

  return {
    filePath: resolvedPath,
    hasAdmin() {
      return database.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).get() !== undefined
    },
    createFirstAdmin(username, passwordHash, now) {
      return database.transaction((transaction) => {
        if (transaction.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).get()) return null
        const id = randomUUID()
        transaction.insert(users).values({ id, username, passwordHash, role: 'admin', active: true, mustChangePassword: false, createdAt: now }).run()
        return transaction.select().from(users).where(eq(users.id, id)).get() ?? null
      })
    },
    findUserByName(username) {
      return database.select().from(users).where(eq(users.username, username)).get() ?? null
    },
    findUserById,
    listUsers() {
      return database.select().from(users).all()
    },
    createUser(username, passwordHash, role, now) {
      const id = randomUUID()
      database.insert(users).values({ id, username, passwordHash, role, active: true, mustChangePassword: true, createdAt: now }).run()
      return findUserById(id)!
    },
    replacePassword(id, passwordHash, mustChangePassword) {
      return database.transaction((transaction) => {
        const changed = transaction.update(users).set({ passwordHash, mustChangePassword }).where(eq(users.id, id)).run().changes > 0
        if (changed) transaction.delete(sessions).where(eq(sessions.userId, id)).run()
        return changed
      })
    },
    deactivateUser(id) {
      return database.transaction((transaction) => {
        const user = transaction.select().from(users).where(eq(users.id, id)).get()
        if (!user) return 'not_found'
        if (user.role === 'admin' && user.active) {
          const otherAdmins = transaction.select({ id: users.id }).from(users).where(and(eq(users.role, 'admin'), eq(users.active, true))).all()
          if (otherAdmins.length <= 1) return 'last_admin'
        }
        transaction.update(users).set({ active: false }).where(eq(users.id, id)).run()
        transaction.delete(sessions).where(eq(sessions.userId, id)).run()
        return 'done'
      })
    },
    createSession(record) {
      database.insert(sessions).values(record).run()
    },
    findSession(tokenHash) {
      return database.select().from(sessions).where(eq(sessions.tokenHash, tokenHash)).get() ?? null
    },
    touchSession(tokenHash, now) {
      database.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.tokenHash, tokenHash)).run()
    },
    deleteSession(tokenHash) {
      database.delete(sessions).where(eq(sessions.tokenHash, tokenHash)).run()
    },
    deleteUserSessions(userId) {
      database.delete(sessions).where(eq(sessions.userId, userId)).run()
    },
    getAttempt(key) {
      return database.select().from(loginAttempts).where(eq(loginAttempts.key, key)).get() ?? null
    },
    recordFailure(key, now) {
      return database.transaction((transaction) => {
        const previous = transaction.select().from(loginAttempts).where(eq(loginAttempts.key, key)).get()
        const firstFailedAt = previous && now - previous.firstFailedAt < 15 * 60_000 ? previous.firstFailedAt : now
        const failureCount = previous && firstFailedAt === previous.firstFailedAt ? previous.failureCount + 1 : 1
        const blockedUntil = failureCount >= 5 ? now + 15 * 60_000 : null
        transaction.insert(loginAttempts).values({ key, firstFailedAt, failureCount, blockedUntil }).onConflictDoUpdate({ target: loginAttempts.key, set: { firstFailedAt, failureCount, blockedUntil } }).run()
        return { key, firstFailedAt, failureCount, blockedUntil }
      })
    },
    clearFailures(key) {
      database.delete(loginAttempts).where(eq(loginAttempts.key, key)).run()
    },
    close() {
      connection.close()
    },
  }
}
