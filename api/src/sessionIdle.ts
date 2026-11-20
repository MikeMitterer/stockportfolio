/** Leerlauffrist ohne Angabe: Wer die App mindestens einmal pro Woche nutzt, bleibt angemeldet (T-98). */
export const DEFAULT_SESSION_IDLE_DAYS = 7

const maxSessionIdleDays = 365
const dayMs = 24 * 60 * 60_000

/**
 * Liest `STOCKPORTFOLIO_SESSION_IDLE_DAYS`: nach wie vielen Tagen ohne Anfrage
 * eine Sitzung abläuft. Jede Nutzung startet die Frist neu, für Sitzung und
 * Cookie gleichermaßen; eine feste Höchstdauer gibt es nicht (T-98).
 *
 * Nur ganze Tage von 1 bis 365. Ein Tippfehler soll den Start beenden, statt
 * still auf eine andere Frist zu fallen.
 *
 * @param value Rohwert aus der Umgebung; leer oder fehlend bedeutet Default.
 * @returns Leerlauffrist in Millisekunden.
 * @throws Error mit verständlicher Meldung bei einem unbrauchbaren Wert.
 */
export function parseSessionIdleMs(value: string | undefined): number {
  const trimmed = value?.trim()
  if (!trimmed) return DEFAULT_SESSION_IDLE_DAYS * dayMs
  const days = /^\d+$/.test(trimmed) ? Number(trimmed) : Number.NaN
  if (!Number.isSafeInteger(days) || days < 1 || days > maxSessionIdleDays) {
    throw new Error(
      `STOCKPORTFOLIO_SESSION_IDLE_DAYS is invalid: expected whole days from 1 to ${maxSessionIdleDays}, for example ${DEFAULT_SESSION_IDLE_DAYS}`,
    )
  }
  return days * dayMs
}
