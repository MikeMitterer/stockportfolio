/**
 * Geteilte `useQuotes`-Instanz.
 *
 * Topbar (Refresh-Button, „vor X Min.") und Dashboard (Tabelle) brauchen
 * denselben Kurs-State. Statt ihn durch die Komponenten zu reichen, gibt es
 * genau eine modul-weite Instanz.
 *
 * In T-05 wird daraus ein Pinia-Store — die Aufrufer-Schnittstelle
 * (`quotes`, `loading`, `loadQuotes`, …) bleibt dabei gleich.
 */

import { useQuotes, type UseQuotesReturn } from '@/composables/useQuotes'
import type { StockInfoClient } from '@/api/client'

let instance: UseQuotesReturn | null = null

/**
 * Liefert die geteilte Instanz und erzeugt sie beim ersten Aufruf.
 *
 * @param client API-Client — nur beim ersten Aufruf ausgewertet.
 */
export function useSharedQuotes(client: StockInfoClient): UseQuotesReturn {
  instance ??= useQuotes(client)
  return instance
}

/** Setzt die Instanz zurück — ausschließlich für Tests. */
export function resetSharedQuotes(): void {
  instance = null
}
