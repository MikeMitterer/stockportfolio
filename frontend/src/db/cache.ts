import { getDb } from './schema'

/** Markt-Caches gehören nicht zu einem Depot und werden beim Kontowechsel entfernt. */
export async function clearMarketCaches(): Promise<void> {
  const database = await getDb()
  await Promise.all([
    database.clear('quoteCache'),
    database.clear('dailyHistory'),
  ])
}
