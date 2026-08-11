/**
 * IndexedDB-Schema und Verbindungsaufbau.
 *
 * Einzige Stelle, die `idb` kennt — alles darüber geht über die
 * Repositories in `repository.ts`.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Portfolio, QuoteCacheEntry, Settings } from '@/types/portfolio'

export const DB_NAME = 'stockportfolio'
export const DB_VERSION = 3

/** Fester Schlüssel des Settings-Singletons. */
export const SETTINGS_KEY = 'default'

/**
 * Eintrag der Instrument-Whitelist.
 *
 * Die Whitelist gehört zum Depot, nicht zur App: Welche Papiere für ein
 * Kinderdepot in Frage kommen, ist eine andere Menge als beim eigenen.
 * Deshalb der zusammengesetzte Schlüssel — `id` ist `<portfolioId>::<key>`,
 * die Einzelteile stehen daneben, damit sich je Depot filtern lässt.
 */
export interface AllowlistEntry {
  id: string
  portfolioId: string
  key: string
  enabled: boolean
}

/** Baut den zusammengesetzten Schlüssel eines Whitelist-Eintrags. */
export function allowlistId(portfolioId: string, key: string): string {
  return `${portfolioId}::${key}`
}

/**
 * Zwischengespeicherter Kursverlauf.
 *
 * Tagesschlusskurse ändern sich einmal täglich. Ohne diesen Speicher holte
 * die App bei jedem Seitenaufbau den Verlauf jeder Position neu — sechs
 * Anfragen für Zahlen, die sich seit gestern nicht bewegt haben.
 */
export interface HistoryEntry {
  /** `<isin>::<period>` */
  key: string
  isin: string
  period: string
  points: { date: string; close: number }[]
  fetchedAt: string
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
    indexes: { byPortfolio: string }
  }
  dailyHistory: {
    key: string
    value: HistoryEntry
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
    async upgrade(db, oldVersion, _newVersion, tx) {
      // Version 0 → 1: Initiales Schema.
      if (oldVersion < 1) {
        db.createObjectStore('portfolios', { keyPath: 'id' })
        db.createObjectStore('settings', { keyPath: 'key' })
        db.createObjectStore('quoteCache', { keyPath: 'key' })
        db.createObjectStore('instrumentAllowlist', { keyPath: 'key' })
      }

      // Version 1 → 2: Die Whitelist bekommt einen Depot-Bezug.
      //
      // Bis hier lag sie global — mit mehreren Depots ist das falsch. Die
      // vorhandenen Einträge gehören dem Depot, das sie angelegt hat; das ist
      // das einzige, das es damals gab. Sie stillschweigend wegzuwerfen wäre
      // die schlechtere Wahl: Wer 20 Papiere ausgeblendet hat, müsste von
      // vorn beginnen.
      if (oldVersion < 2) {
        const alt = await tx.objectStore('instrumentAllowlist').getAll()
        db.deleteObjectStore('instrumentAllowlist')
        const store = db.createObjectStore('instrumentAllowlist', { keyPath: 'id' })
        store.createIndex('byPortfolio', 'portfolioId')

        const [erstesDepot] = await tx.objectStore('portfolios').getAllKeys()
        if (erstesDepot) {
          for (const entry of alt as { key: string; enabled: boolean }[]) {
            await tx
              .objectStore('instrumentAllowlist')
              .put({
                id: allowlistId(erstesDepot, entry.key),
                portfolioId: erstesDepot,
                key: entry.key,
                enabled: entry.enabled,
              })
          }
        }
      }

      // Version 2 → 3: Zwischenspeicher für den Kursverlauf.
      //
      // Rein additiv — nichts umzuziehen. Fehlt der Verlauf, wird er geholt.
      if (oldVersion < 3 && !db.objectStoreNames.contains('dailyHistory')) {
        db.createObjectStore('dailyHistory', { keyPath: 'key' })
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
