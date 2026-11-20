/**
 * Private Depotdaten je Konto: Depots, Einstellungen, Freigabelisten,
 * Tageswerte und der Kurs-Hinweis, jeweils mit Revision.
 *
 * Getrennt von Konten, Sitzungen und Anmeldeversuchen in `repository.ts`, das
 * beide Teile zu einem `AccountRepository` zusammensetzt (T-134).
 */
import { and, eq } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { privateResources, users } from './schema.js'

export type ResourceKind = 'portfolio' | 'settings' | 'allowlist' | 'snapshots' | 'quote-refresh'

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

export interface PrivateDataRepository {
  listResources(userId: string, kind: ResourceKind): PrivateResource[]
  findResource(userId: string, kind: ResourceKind, resourceId: string): PrivateResource | null
  saveResource(
    userId: string,
    kind: ResourceKind,
    resourceId: string,
    revision: number,
    value: unknown,
  ): number | 'not_found' | null
  deleteResource(
    userId: string,
    kind: ResourceKind,
    resourceId: string,
    revision: number,
  ): 'done' | 'not_found' | 'conflict'
  importLegacy(
    userId: string,
    portfolios: LegacyPortfolio[],
    settings: Record<string, unknown> | null,
  ): 'done' | 'forbidden' | 'imported' | 'conflict'
  restoreBackup(userId: string, data: RestoreData): 'done' | 'not_found' | 'conflict'
}

export function createPrivateDataRepository(
  database: BetterSQLite3Database,
): PrivateDataRepository {
  function resourceWhere(userId: string, kind: ResourceKind, resourceId: string) {
    return and(
      eq(privateResources.ownerId, userId),
      eq(privateResources.kind, kind),
      eq(privateResources.resourceId, resourceId),
    )
  }

  function decodeResource(row: typeof privateResources.$inferSelect): PrivateResource {
    return {
      resourceId: row.resourceId,
      revision: row.revision,
      value: JSON.parse(row.value) as unknown,
    }
  }

  return {
    listResources(userId, kind) {
      return database
        .select()
        .from(privateResources)
        .where(and(eq(privateResources.ownerId, userId), eq(privateResources.kind, kind)))
        .all()
        .map(decodeResource)
    },
    findResource(userId, kind, resourceId) {
      const row = database
        .select()
        .from(privateResources)
        .where(resourceWhere(userId, kind, resourceId))
        .get()
      return row ? decodeResource(row) : null
    },
    saveResource(userId, kind, resourceId, revision, value) {
      return database.transaction((transaction) => {
        if (kind === 'allowlist' || kind === 'snapshots') {
          const parent = transaction
            .select({ resourceId: privateResources.resourceId })
            .from(privateResources)
            .where(resourceWhere(userId, 'portfolio', resourceId))
            .get()
          if (!parent) return 'not_found'
        }
        if (kind === 'settings') {
          const activeId = (value as { activePortfolioId: string }).activePortfolioId
          if (
            activeId &&
            !transaction
              .select({ resourceId: privateResources.resourceId })
              .from(privateResources)
              .where(resourceWhere(userId, 'portfolio', activeId))
              .get()
          )
            return 'not_found'
        }
        const current = transaction
          .select({ revision: privateResources.revision })
          .from(privateResources)
          .where(resourceWhere(userId, kind, resourceId))
          .get()
        if ((current?.revision ?? 0) !== revision) return null
        const nextRevision = revision + 1
        if (current) {
          transaction
            .update(privateResources)
            .set({ revision: nextRevision, value: JSON.stringify(value) })
            .where(resourceWhere(userId, kind, resourceId))
            .run()
        } else {
          transaction
            .insert(privateResources)
            .values({
              ownerId: userId,
              kind,
              resourceId,
              revision: nextRevision,
              value: JSON.stringify(value),
            })
            .run()
        }
        return nextRevision
      })
    },
    deleteResource(userId, kind, resourceId, revision) {
      return database.transaction((transaction) => {
        const current = transaction
          .select({ revision: privateResources.revision })
          .from(privateResources)
          .where(resourceWhere(userId, kind, resourceId))
          .get()
        if (!current) return 'not_found'
        if (current.revision !== revision) return 'conflict'
        transaction
          .delete(privateResources)
          .where(resourceWhere(userId, kind, resourceId))
          .run()
        if (kind === 'portfolio') {
          for (const childKind of ['allowlist', 'snapshots'] as const) {
            transaction
              .delete(privateResources)
              .where(resourceWhere(userId, childKind, resourceId))
              .run()
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
        const existing = transaction
          .select({ kind: privateResources.kind, resourceId: privateResources.resourceId })
          .from(privateResources)
          .where(eq(privateResources.ownerId, userId))
          .all()
        const importedIds = new Set(portfolios.map((entry) => entry.portfolio.id))
        if (existing.some((row) => row.kind === 'portfolio' && importedIds.has(row.resourceId)))
          return 'conflict'
        if (
          settings &&
          !existing.some((row) => row.kind === 'settings' && row.resourceId === 'current')
        ) {
          const activeId = String(settings.activePortfolioId)
          if (
            activeId &&
            !importedIds.has(activeId) &&
            !existing.some((row) => row.kind === 'portfolio' && row.resourceId === activeId)
          )
            return 'conflict'
        }
        for (const entry of portfolios) {
          const resourceId = String(entry.portfolio.id)
          for (const [kind, value] of [
            ['portfolio', entry.portfolio],
            ['allowlist', entry.allowlist],
            ['snapshots', entry.snapshots],
          ] as const) {
            transaction
              .insert(privateResources)
              .values({
                ownerId: userId,
                kind,
                resourceId,
                revision: 1,
                value: JSON.stringify(value),
              })
              .run()
          }
        }
        if (
          settings &&
          !existing.some((row) => row.kind === 'settings' && row.resourceId === 'current')
        ) {
          transaction
            .insert(privateResources)
            .values({
              ownerId: userId,
              kind: 'settings',
              resourceId: 'current',
              revision: 1,
              value: JSON.stringify(settings),
            })
            .run()
        }
        transaction.update(users).set({ legacyImported: true }).where(eq(users.id, userId)).run()
        return 'done'
      })
    },
    restoreBackup(userId, data) {
      return database.transaction((transaction) => {
        const id = String(data.portfolio.id)
        if (data.replacedId && data.replacedId !== id) {
          const previous = transaction
            .select({ revision: privateResources.revision })
            .from(privateResources)
            .where(resourceWhere(userId, 'portfolio', data.replacedId))
            .get()
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
          const current = transaction
            .select({ revision: privateResources.revision })
            .from(privateResources)
            .where(resourceWhere(userId, kind, resourceId))
            .get()
          if ((current?.revision ?? 0) !== revision) return 'conflict'
        }
        for (const [kind, resourceId, value, revision] of resources) {
          if (revision === 0) {
            transaction
              .insert(privateResources)
              .values({
                ownerId: userId,
                kind,
                resourceId,
                revision: 1,
                value: JSON.stringify(value),
              })
              .run()
          } else {
            transaction
              .update(privateResources)
              .set({ revision: revision + 1, value: JSON.stringify(value) })
              .where(resourceWhere(userId, kind, resourceId))
              .run()
          }
        }
        if (data.replacedId && data.replacedId !== id) {
          for (const kind of ['portfolio', 'allowlist', 'snapshots'] as const) {
            transaction
              .delete(privateResources)
              .where(resourceWhere(userId, kind, data.replacedId))
              .run()
          }
        }
        return 'done'
      })
    },
  }
}
