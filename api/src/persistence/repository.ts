import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { loginAttempts, privateResources, sessions, users } from './schema.js'

export type ResourceKind = 'portfolio' | 'settings' | 'allowlist' | 'snapshots'

export interface PrivateResource {
  resourceId: string
  revision: number
  value: unknown
}

export interface LegacyPortfolio {
  portfolio: Record<string, unknown>
  allowlist: Record<string, boolean>
  snapshots: unknown[]
}

export interface RestoreData extends LegacyPortfolio {
  settings: Record<string, unknown>
  replacedId: string | null
  revisions: {
    portfolio: number
    settings: number
    allowlist: number
    snapshots: number
    replaced: number | null
  }
}

export interface UserRecord {
  id: string
  username: string
  passwordHash: string
  role: 'admin' | 'user'
  active: boolean
  mustChangePassword: boolean
  isSetupAccount: boolean
  legacyImported: boolean
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
  reactivateUser(id: string): boolean
  listResources(userId: string, kind: ResourceKind): PrivateResource[]
  findResource(userId: string, kind: ResourceKind, resourceId: string): PrivateResource | null
  saveResource(userId: string, kind: ResourceKind, resourceId: string, revision: number, value: unknown): number | 'not_found' | null
  deleteResource(userId: string, kind: ResourceKind, resourceId: string, revision: number): 'done' | 'not_found' | 'conflict'
  importLegacy(userId: string, portfolios: LegacyPortfolio[], settings: Record<string, unknown> | null): 'done' | 'forbidden' | 'imported' | 'conflict'
  restoreBackup(userId: string, data: RestoreData): 'done' | 'not_found' | 'conflict'
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

  function resourceWhere(userId: string, kind: ResourceKind, resourceId: string) {
    return and(eq(privateResources.ownerId, userId), eq(privateResources.kind, kind), eq(privateResources.resourceId, resourceId))
  }

  function decodeResource(row: typeof privateResources.$inferSelect): PrivateResource {
    return { resourceId: row.resourceId, revision: row.revision, value: JSON.parse(row.value) as unknown }
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
        transaction.insert(users).values({ id, username, passwordHash, role: 'admin', active: true, mustChangePassword: false, isSetupAccount: true, createdAt: now }).run()
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
    reactivateUser(id) {
      return database.update(users).set({ active: true }).where(eq(users.id, id)).run().changes > 0
    },
    listResources(userId, kind) {
      return database.select().from(privateResources).where(and(eq(privateResources.ownerId, userId), eq(privateResources.kind, kind))).all().map(decodeResource)
    },
    findResource(userId, kind, resourceId) {
      const row = database.select().from(privateResources).where(resourceWhere(userId, kind, resourceId)).get()
      return row ? decodeResource(row) : null
    },
    saveResource(userId, kind, resourceId, revision, value) {
      return database.transaction((transaction) => {
        if (kind === 'allowlist' || kind === 'snapshots') {
          const parent = transaction.select({ resourceId: privateResources.resourceId }).from(privateResources).where(resourceWhere(userId, 'portfolio', resourceId)).get()
          if (!parent) return 'not_found'
        }
        if (kind === 'settings') {
          const activeId = (value as { activePortfolioId: string }).activePortfolioId
          if (activeId && !transaction.select({ resourceId: privateResources.resourceId }).from(privateResources).where(resourceWhere(userId, 'portfolio', activeId)).get()) return 'not_found'
        }
        const current = transaction.select({ revision: privateResources.revision }).from(privateResources).where(resourceWhere(userId, kind, resourceId)).get()
        if (kind === 'portfolio' && !current) {
          const occupied = transaction.select({ ownerId: privateResources.ownerId }).from(privateResources).where(and(eq(privateResources.kind, 'portfolio'), eq(privateResources.resourceId, resourceId))).get()
          if (occupied) return 'not_found'
        }
        if ((current?.revision ?? 0) !== revision) return null
        const nextRevision = revision + 1
        if (current) {
          transaction.update(privateResources).set({ revision: nextRevision, value: JSON.stringify(value) }).where(resourceWhere(userId, kind, resourceId)).run()
        } else {
          transaction.insert(privateResources).values({ ownerId: userId, kind, resourceId, revision: nextRevision, value: JSON.stringify(value) }).run()
        }
        return nextRevision
      })
    },
    deleteResource(userId, kind, resourceId, revision) {
      return database.transaction((transaction) => {
        const current = transaction.select({ revision: privateResources.revision }).from(privateResources).where(resourceWhere(userId, kind, resourceId)).get()
        if (!current) return 'not_found'
        if (current.revision !== revision) return 'conflict'
        transaction.delete(privateResources).where(resourceWhere(userId, kind, resourceId)).run()
        if (kind === 'portfolio') {
          for (const childKind of ['allowlist', 'snapshots'] as const) {
            transaction.delete(privateResources).where(resourceWhere(userId, childKind, resourceId)).run()
          }
        }
        return 'done'
      })
    },
    importLegacy(userId, portfolios, settings) {
      return database.transaction((transaction) => {
        const user = transaction.select().from(users).where(eq(users.id, userId)).get()
        if (!user?.isSetupAccount) return 'forbidden'
        if (user.legacyImported) return 'imported'
        const existing = transaction.select({ kind: privateResources.kind, resourceId: privateResources.resourceId }).from(privateResources).where(eq(privateResources.ownerId, userId)).all()
        const importedIds = new Set(portfolios.map((entry) => entry.portfolio.id))
        if (existing.some((row) => row.kind === 'portfolio' && importedIds.has(row.resourceId))) return 'conflict'
        if (settings && !existing.some((row) => row.kind === 'settings' && row.resourceId === 'current')) {
          const activeId = String(settings.activePortfolioId)
          if (activeId && !importedIds.has(activeId) && !existing.some((row) => row.kind === 'portfolio' && row.resourceId === activeId)) return 'conflict'
        }
        for (const entry of portfolios) {
          const occupied = transaction.select({ ownerId: privateResources.ownerId }).from(privateResources).where(and(eq(privateResources.kind, 'portfolio'), eq(privateResources.resourceId, String(entry.portfolio.id)))).get()
          if (occupied) return 'conflict'
        }
        for (const entry of portfolios) {
          const resourceId = String(entry.portfolio.id)
          for (const [kind, value] of [
            ['portfolio', entry.portfolio],
            ['allowlist', entry.allowlist],
            ['snapshots', entry.snapshots],
          ] as const) {
            transaction.insert(privateResources).values({ ownerId: userId, kind, resourceId, revision: 1, value: JSON.stringify(value) }).run()
          }
        }
        if (settings && !existing.some((row) => row.kind === 'settings' && row.resourceId === 'current')) {
          transaction.insert(privateResources).values({ ownerId: userId, kind: 'settings', resourceId: 'current', revision: 1, value: JSON.stringify(settings) }).run()
        }
        transaction.update(users).set({ legacyImported: true }).where(eq(users.id, userId)).run()
        return 'done'
      })
    },
    restoreBackup(userId, data) {
      return database.transaction((transaction) => {
        const id = String(data.portfolio.id)
        const occupied = transaction.select({ ownerId: privateResources.ownerId }).from(privateResources).where(and(eq(privateResources.kind, 'portfolio'), eq(privateResources.resourceId, id))).get()
        if (occupied && occupied.ownerId !== userId) return 'not_found'
        if (data.replacedId && data.replacedId !== id) {
          const previous = transaction.select({ revision: privateResources.revision }).from(privateResources).where(resourceWhere(userId, 'portfolio', data.replacedId)).get()
          if (!previous) return 'not_found'
          if (previous.revision !== data.revisions.replaced) return 'conflict'
        }
        const resources = [
          ['portfolio', id, data.portfolio, data.revisions.portfolio],
          ['settings', 'current', data.settings, data.revisions.settings],
          ['allowlist', id, data.allowlist, data.revisions.allowlist],
          ['snapshots', id, data.snapshots, data.revisions.snapshots],
        ] as const
        for (const [kind, resourceId, , revision] of resources) {
          const current = transaction.select({ revision: privateResources.revision }).from(privateResources).where(resourceWhere(userId, kind, resourceId)).get()
          if ((current?.revision ?? 0) !== revision) return 'conflict'
        }
        for (const [kind, resourceId, value, revision] of resources) {
          if (revision === 0) {
            transaction.insert(privateResources).values({ ownerId: userId, kind, resourceId, revision: 1, value: JSON.stringify(value) }).run()
          } else {
            transaction.update(privateResources).set({ revision: revision + 1, value: JSON.stringify(value) }).where(resourceWhere(userId, kind, resourceId)).run()
          }
        }
        if (data.replacedId && data.replacedId !== id) {
          for (const kind of ['portfolio', 'allowlist', 'snapshots'] as const) {
            transaction.delete(privateResources).where(resourceWhere(userId, kind, data.replacedId)).run()
          }
        }
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
