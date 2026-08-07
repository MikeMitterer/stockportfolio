/**
 * IndexedDB-Schema und Verbindungsaufbau.
 *
 * Einzige Stelle, die `idb` kennt — alles darüber geht über die
 * Repositories in `repository.ts`.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Portfolio, QuoteCacheEntry, Settings } from '@/types/portfolio'

export const DB_NAME = 'stockportfolio'
export const DB_VERSION = 1

/** Fester Schlüssel des Settings-Singletons. */
export const SETTINGS_KEY = 'default'

/** Eintrag der Instrument-Whitelist. */
export interface AllowlistEntry {
  key: string
  enabled: boolean
}

export interface StockPortfolioDB extends DBSchema {
  portfolios: {
    key: string
    value: Portfolio
  }
  settings: {
    key: string
    value: Settings & { key: string }
  }
  quoteCache: {
    key: string
    value: QuoteCacheEntry & { key: string }
  }
  instrumentAllowlist: {
    key: string
    value: AllowlistEntry
  }
}

let dbPromise: Promise<IDBPDatabase<StockPortfolioDB>> | null = null

/**
 * Öffnet die Datenbank (einmalig) und legt fehlende Object-Stores an.
 *
 * @returns Verbindung zur IndexedDB.
 */
export function getDb(): Promise<IDBPDatabase<StockPortfolioDB>> {
  dbPromise ??= openDB<StockPortfolioDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Version 0 → 1: Initiales Schema.
      if (oldVersion < 1) {
        db.createObjectStore('portfolios', { keyPath: 'id' })
        db.createObjectStore('settings', { keyPath: 'key' })
        db.createObjectStore('quoteCache', { keyPath: 'key' })
        db.createObjectStore('instrumentAllowlist', { keyPath: 'key' })
      }
    },
  })
  return dbPromise
}

/** Schließt die Verbindung und vergisst sie — ausschließlich für Tests. */
export async function closeDb(): Promise<void> {
  if (!dbPromise) return
  const db = await dbPromise
  db.close()
  dbPromise = null
}
