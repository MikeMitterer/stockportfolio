/**
 * Liest `STOCKPORTFOLIO_PUBLIC_ORIGIN` und führt den Wert auf die Form zurück,
 * die Browser im `Origin`-Header senden: Schema, Host und ein Port, der vom
 * Standard abweicht — ohne Schrägstrich am Ende (T-91).
 *
 * Die Origin-Prüfung der Konto-API vergleicht zeichengenau. Ein Schrägstrich
 * am Ende, Großbuchstaben im Host oder `:443` bei HTTPS ließen sonst jede
 * Anmeldung mit `invalid_origin` scheitern, ohne Hinweis auf die Ursache.
 * Werte, die sich nicht eindeutig zurückführen lassen (Pfad, Query, Fragment,
 * Zugangsdaten, anderes Schema), brechen den Start mit einer klaren Meldung ab.
 *
 * Der Pfad wird am Rohwert geprüft, nicht an `URL.pathname`: `new URL()` löst
 * Punktsegmente wie `/.`, `/%2e` oder `/a/..` zu `/` auf, und ein solcher Wert
 * sähe sonst gültig aus. Enthält der Wert ein `@`, erscheint er nicht in der
 * Meldung — sie landet im Container-Log, und ein Passwort gehört nicht dorthin.
 *
 * @param value Rohwert aus der Umgebung; leer oder fehlend bedeutet „nicht gesetzt“.
 * @returns Der normalisierte Origin, oder `undefined`, wenn nichts gesetzt ist.
 * @throws Error mit verständlicher Meldung bei einem unbrauchbaren Wert.
 */
export function normalizePublicOrigin(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  const shown = trimmed.includes('@') ? '' : ` "${trimmed}"`
  const invalid = (reason: string) =>
    new Error(`STOCKPORTFOLIO_PUBLIC_ORIGIN${shown} is invalid: ${reason}. Expected the browser address without a path, for example https://portfolio.example.com or http://192.168.1.10:8088`)

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    throw invalid('not a URL')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw invalid('scheme must be http or https')
  if (url.username || url.password) throw invalid('must not contain user credentials')
  // Alles hinter Schema und Host, bis zu Query oder Fragment. Ein Backslash
  // beendet den Host wie bei `new URL()`.
  const rawPath = trimmed.replace(/^[a-z][a-z\d+.-]*:\/\/[^/\\?#]*/i, '').replace(/[?#].*$/s, '')
  if (url.pathname !== '/' || (rawPath !== '' && rawPath !== '/')) throw invalid('must not contain a path')
  if (url.search || trimmed.includes('?')) throw invalid('must not contain a query')
  if (url.hash || trimmed.includes('#')) throw invalid('must not contain a fragment')
  return url.origin
}
