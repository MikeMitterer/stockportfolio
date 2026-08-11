/**
 * Repositories — kapseln jeden IndexedDB-Zugriff.
 *
 * Stores und Komponenten sprechen ausschließlich mit diesen Klassen;
 * `idb` taucht außerhalb von `src/db/` nirgends auf.
 */

import { allowlistId, getDb, SETTINGS_KEY, type AllowlistEntry } from './schema'
import type { Portfolio, QuoteCacheEntry, Settings } from '@/types/portfolio'

/**
 * Erzeugt eine klonbare Kopie ohne Reactivity-Proxies.
 *
 * Vue verpackt Store-State in Proxy-Objekte. IndexedDB serialisiert mit dem
 * Structured-Clone-Algorithmus, der an solchen Proxies scheitert
 * (`DataCloneError`). Da unser Datenmodell reines JSON ist (Strings, Zahlen,
 * Booleans, null, Arrays, verschachtelte Objekte — keine Dates, keine
 * Funktionen), ist der JSON-Rundlauf hier verlustfrei und macht die Absicht
 * explizit: was in die DB geht, ist plain data.
 */
function toStorable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export class PortfolioRepository {
  /** Alle gespeicherten Portfolios. */
  async findAll(): Promise<Portfolio[]> {
    const db = await getDb()
    return db.getAll('portfolios')
  }

  /** Ein Portfolio anhand seiner ID; `null` wenn nicht vorhanden. */
  async findById(id: string): Promise<Portfolio | null> {
    const db = await getDb()
    return (await db.get('portfolios', id)) ?? null
  }

  /** Legt ein Portfolio an oder überschreibt es und setzt `updatedAt`. */
  async save(portfolio: Portfolio): Promise<void> {
    const db = await getDb()
    await db.put('portfolios', toStorable({ ...portfolio, updatedAt: new Date().toISOString() }))
  }

  /** Löscht ein Portfolio. */
  async remove(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('portfolios', id)
  }

  /** Anzahl gespeicherter Portfolios — für die Seeding-Entscheidung. */
  async count(): Promise<number> {
    const db = await getDb()
    return db.count('portfolios')
  }
}

export class SettingsRepository {
  /** Gespeicherte Einstellungen; `null` beim Erststart. */
  async load(): Promise<Settings | null> {
    const db = await getDb()
    const stored = await db.get('settings', SETTINGS_KEY)
    if (!stored) return null
    const { key: _key, ...settings } = stored
    return settings
  }

  /** Schreibt die Einstellungen (Singleton unter festem Schlüssel). */
  async save(settings: Settings): Promise<void> {
    const db = await getDb()
    await db.put('settings', toStorable({ ...settings, key: SETTINGS_KEY }))
  }
}

export class QuoteCacheRepository {
  /** Alle gecachten Kurse als Map (Key = ISIN oder Symbol). */
  async loadAll(): Promise<Map<string, QuoteCacheEntry>> {
    const db = await getDb()
    const rows = await db.getAll('quoteCache')
    return new Map(
      rows.map((row) => {
        const { key, ...entry } = row
        return [key, entry]
      }),
    )
  }

  /** Ersetzt den gesamten Cache-Inhalt in einer Transaktion. */
  async replaceAll(quotes: Map<string, QuoteCacheEntry>): Promise<void> {
    const db = await getDb()
    const tx = db.transaction('quoteCache', 'readwrite')
    await tx.store.clear()
    for (const [key, entry] of quotes) {
      await tx.store.put(toStorable({ ...entry, key }))
    }
    await tx.done
  }

  /** Schreibt einen einzelnen Kurs. */
  async put(key: string, entry: QuoteCacheEntry): Promise<void> {
    const db = await getDb()
    await db.put('quoteCache', toStorable({ ...entry, key }))
  }
}

export class AllowlistRepository {
  /**
   * Whitelist eines Depots als Map (Key → freigegeben).
   *
   * Je Depot, nicht global: Welche Papiere für ein Kinderdepot in Frage
   * kommen, ist eine andere Menge als beim eigenen.
   *
   * @param portfolioId Kennung des Depots.
   */
  async loadAll(portfolioId: string): Promise<Map<string, boolean>> {
    const db = await getDb()
    const rows = await db.getAllFromIndex('instrumentAllowlist', 'byPortfolio', portfolioId)
    return new Map(rows.map((row) => [row.key, row.enabled]))
  }

  /** Setzt den Status eines Instruments in einem Depot. */
  async setEnabled(portfolioId: string, key: string, enabled: boolean): Promise<void> {
    const db = await getDb()
    const entry: AllowlistEntry = { id: allowlistId(portfolioId, key), portfolioId, key, enabled }
    await db.put('instrumentAllowlist', entry)
  }

  /**
   * Ersetzt die Whitelist eines Depots vollständig — für Sicherungen.
   *
   * Erst die Einträge dieses Depots löschen, dann schreiben: Ein
   * Zusammenführen ließe Einträge stehen, die in der Sicherung bewusst nicht
   * mehr vorkommen. Andere Depots bleiben unberührt.
   *
   * @param portfolioId Kennung des Depots.
   * @param entries     Neue Whitelist (Key → freigegeben).
   */
  async replaceAll(portfolioId: string, entries: Map<string, boolean>): Promise<void> {
    const db = await getDb()
    const tx = db.transaction('instrumentAllowlist', 'readwrite')
    const index = tx.store.index('byPortfolio')

    for (const key of await index.getAllKeys(portfolioId)) {
      await tx.store.delete(key)
    }
    for (const [key, enabled] of entries) {
      await tx.store.put({ id: allowlistId(portfolioId, key), portfolioId, key, enabled })
    }
    await tx.done
  }

  /**
   * Entfernt die Whitelist eines Depots — beim Löschen des Depots.
   *
   * Ohne das blieben die Einträge für immer liegen; sichtbar wären sie nie
   * wieder, weil es das Depot nicht mehr gibt.
   */
  async removeForPortfolio(portfolioId: string): Promise<void> {
    const db = await getDb()
    const tx = db.transaction('instrumentAllowlist', 'readwrite')
    const index = tx.store.index('byPortfolio')

    for (const key of await index.getAllKeys(portfolioId)) {
      await tx.store.delete(key)
    }
    await tx.done
  }

  /** Anzahl der Einträge eines Depots — um „noch nie befüllt" zu erkennen. */
  async count(portfolioId: string): Promise<number> {
    const db = await getDb()
    return db.countFromIndex('instrumentAllowlist', 'byPortfolio', portfolioId)
  }
}

