/**
 * IndexedDB-Schema und Verbindungsaufbau.
 *
 * Einzige Stelle, die `idb` kennt — alles darüber geht über die
 * Repositories in `repository.ts`.
 */

import {
  openDB,
  type DBSchema,
  type IDBPDatabase,
  type IDBPTransaction,
  type StoreNames,
} from 'idb'
import type { Portfolio, QuoteCacheEntry, Settings } from '@/types/portfolio'

export const DB_NAME = 'stockportfolio'
export const DB_VERSION = 4

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
  /**
   * Ein Gesamtwert je Tag und Depot.
   *
   * Der Rückblick rechnet den heutigen Bestand gegen alte Kurse; diese
   * Schnappschüsse halten fest, was tatsächlich dastand — inklusive Käufen und
   * Verkäufen. Sie beginnen leer und werden mit jedem Tag wertvoller.
   */
  valueSnapshots: {
    key: string
    value: ValueSnapshotEntry
    indexes: { byPortfolio: string }
  }
}

/** Ein Tagesstand, zusammengesetzt aus Depot und Datum. */
export interface ValueSnapshotEntry {
  /** `<portfolioId>::<YYYY-MM-DD>` — ein Eintrag je Depot und Tag. */
  key: string
  portfolioId: string
  date: string
  total: number
}

let dbPromise: Promise<IDBPDatabase<StockPortfolioDB>> | null = null

/**
 * Öffnet die Datenbank (einmalig) und legt fehlende Object-Stores an.
 *
 * @returns Verbindung zur IndexedDB.
 */
/**
 * Legt das Ausgangsschema an.
 *
 * @param db Die zu erweiternde Datenbank.
 */
function createInitialStores(db: IDBPDatabase<StockPortfolioDB>): void {
  db.createObjectStore('portfolios', { keyPath: 'id' })
  db.createObjectStore('settings', { keyPath: 'key' })
  db.createObjectStore('quoteCache', { keyPath: 'key' })
  db.createObjectStore('instrumentAllowlist', { keyPath: 'key' })
}

/**
 * Gibt der Whitelist einen Depot-Bezug (Version 1 → 2).
 *
 * Bis dahin lag sie global — mit mehreren Depots ist das falsch. Die
 * vorhandenen Einträge gehören dem Depot, das sie angelegt hat; das ist das
 * einzige, das es damals gab. Sie stillschweigend wegzuwerfen wäre die
 * schlechtere Wahl: Wer 20 Papiere ausgeblendet hat, müsste von vorn beginnen.
 *
 * @param db          Die zu ändernde Datenbank.
 * @param transaction Die laufende Upgrade-Transaktion.
 */
async function scopeAllowlistToPortfolio(
  db: IDBPDatabase<StockPortfolioDB>,
  transaction: IDBPTransaction<StockPortfolioDB, StoreNames<StockPortfolioDB>[], 'versionchange'>,
): Promise<void> {
  const previous = (await transaction.objectStore('instrumentAllowlist').getAll()) as unknown as {
    key: string
    enabled: boolean
  }[]

  db.deleteObjectStore('instrumentAllowlist')
  const store = db.createObjectStore('instrumentAllowlist', { keyPath: 'id' })
  store.createIndex('byPortfolio', 'portfolioId')

  const [firstPortfolio] = await transaction.objectStore('portfolios').getAllKeys()
  if (!firstPortfolio) return

  for (const entry of previous) {
    await transaction.objectStore('instrumentAllowlist').put({
      id: allowlistId(firstPortfolio, entry.key),
      portfolioId: firstPortfolio,
      key: entry.key,
      enabled: entry.enabled,
    })
  }
}

/**
 * Öffnet die Datenbank (einmalig) und wendet fehlende Migrationen an.
 *
 * @returns Verbindung zur IndexedDB.
 */
export function getDb(): Promise<IDBPDatabase<StockPortfolioDB>> {
  dbPromise ??= openDB<StockPortfolioDB>(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) createInitialStores(db)
      if (oldVersion < 2) await scopeAllowlistToPortfolio(db, transaction)

      // Version 3 → 4: Tageswerte des Depots. Rein additiv; der Speicher
      // beginnt leer und füllt sich ab dem ersten Start dieser Fassung.
      if (oldVersion < 4 && !db.objectStoreNames.contains('valueSnapshots')) {
        const store = db.createObjectStore('valueSnapshots', { keyPath: 'key' })
        store.createIndex('byPortfolio', 'portfolioId')
      }
      // Version 2 → 3: Zwischenspeicher für den Kursverlauf. Rein additiv —
      // fehlt der Verlauf, wird er geholt.
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
