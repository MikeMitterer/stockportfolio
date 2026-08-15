/**
 * Sicherung und Wiederherstellung des Depots.
 *
 * Alle Daten der App liegen im Browser. Ein gelöschter Website-Speicher, ein
 * neues Gerät oder ein anderer Browser heißt: alles weg. Diese Datei ist die
 * einzige Möglichkeit, das zu überleben — entsprechend streng ist die Prüfung
 * beim Einlesen.
 *
 * Reine Funktionen, kein DOM: Weder Datei-Auswahl noch Download stehen hier.
 */

import type { ValueSnapshot } from '@/domain/portfolioHistory'
import type { AssetGroup, InstrumentKind, Portfolio, Position, Settings } from '@/types/portfolio'

/** Erkennungsmerkmal der Datei — verhindert das Einlesen fremder JSON-Dateien. */
export const BACKUP_KIND = 'stockportfolio-backup'

/**
 * Fassung des Dateiformats.
 *
 * Wird beim Einlesen geprüft. Eine neuere Fassung als die bekannte wird
 * abgelehnt statt geraten: Ein stillschweigend falsch interpretiertes Feld
 * wäre schlimmer als eine klare Fehlermeldung.
 *
 * Bleibt bei 1, obwohl die Freigabeliste dazugekommen ist: Das Feld ist rein
 * additiv. Eine ältere App überliest es, eine neuere kommt ohne es aus. Die
 * Fassung hochzuzählen würde nur dazu führen, dass eine ältere App eine Datei
 * ablehnt, die sie problemlos lesen könnte.
 */
export const BACKUP_SCHEMA_VERSION = 2

export interface Backup {
  kind: typeof BACKUP_KIND
  schemaVersion: number
  /** Fassung der App, die die Datei geschrieben hat — nur zur Information. */
  appVersion: string
  exportedAt: string
  portfolio: Portfolio
  settings: Settings
  /**
   * Freigabe je Instrument (Key → freigegeben), als Objekt statt als `Map`.
   *
   * Auch das ist eine Nutzerentscheidung: Wer aus einem großen Katalog ein
   * Dutzend Papiere ausgeblendet hat, will das nach einem Gerätewechsel nicht
   * noch einmal tun.
   *
   * Ältere Sicherungen kennen das Feld nicht — dort gilt eine leere Liste,
   * und leer heißt „nichts ausgeblendet", nicht „nichts erlaubt".
   */
  allowlist: Record<string, boolean>
  /**
   * Tageswerte des Depots.
   *
   * Der Rückblick lässt sich jederzeit neu rechnen — die gemessenen Tageswerte
   * nicht. Sie entstehen nur, indem die App über Monate benutzt wird; ohne sie
   * in der Sicherung wäre nach einem Gerätewechsel genau der Teil weg, der am
   * längsten gebraucht hat.
   *
   * Ältere Sicherungen kennen das Feld nicht — dort gilt eine leere Liste.
   */
  valueHistory: ValueSnapshot[]
}

/**
 * Grund einer Ablehnung — als Schlüssel, nicht als Satz.
 *
 * Die Domäne kennt keine Sprache: Ein deutscher Prosatext von hier stünde
 * unübersetzbar in einer englischen Oberfläche. Sie sagt *was* nicht stimmt,
 * die Anzeige sagt es in der Sprache des Nutzers.
 */
export interface BackupError {
  /** Schlüssel im Message-Katalog, unterhalb von `backupErrors`. */
  key: string
  /** Werte für die Platzhalter des Textes. */
  params?: Record<string, string | number>
}

/** Was beim Einlesen herauskommt: entweder Daten oder ein Grund. */
export type ParseResult =
  | { ok: true; backup: Backup }
  | { ok: false; error: BackupError }

/**
 * Baut den Inhalt der Sicherungsdatei.
 *
 * Kurse bleiben bewusst draußen: Sie sind abgeleitet, jederzeit neu abrufbar
 * und in einer Sicherung von gestern ohnehin wertlos.
 *
 * @param portfolio  Das zu sichernde Depot.
 * @param settings   Die zugehörigen Einstellungen.
 * @param allowlist  Freigabe je Instrument.
 * @param appVersion Fassung der App.
 * @param exportedAt Zeitpunkt als ISO-String.
 */
export function buildBackup(
  portfolio: Portfolio,
  settings: Settings,
  allowlist: Map<string, boolean>,
  appVersion: string,
  exportedAt: string,
  valueHistory: ValueSnapshot[] = [],
): Backup {
  return {
    kind: BACKUP_KIND,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion,
    exportedAt,
    portfolio,
    settings,
    allowlist: Object.fromEntries(allowlist),
    valueHistory,
  }
}

/**
 * Dateiname mit Depotnamen und Datum.
 *
 * Wer mehrere Sicherungen im Download-Ordner liegen hat, soll sie ohne
 * Öffnen unterscheiden können.
 *
 * @param portfolioName Name des Depots.
 * @param exportedAt    Zeitpunkt als ISO-String.
 */
export function backupFileName(portfolioName: string, exportedAt: string): string {
  const slug =
    portfolioName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'depot'
  const day = exportedAt.slice(0, 10)
  return `stockportfolio-${slug}-${day}.json`
}

const GROUPS: readonly AssetGroup[] = ['stocks', 'bonds', 'metals', 'moneymarket', 'cash']
const KINDS: readonly InstrumentKind[] = ['etf', 'stock']

/**
 * Liest und prüft den Inhalt einer Sicherungsdatei.
 *
 * Streng statt nachsichtig: Eine halb gelesene Datei würde ein halbes Depot
 * herstellen, und das fiele erst auf, wenn die Zahlen nicht mehr stimmen. Im
 * Zweifel lieber ablehnen — die Datei ist ja noch da.
 *
 * @param raw Dateiinhalt als Text.
 */
/**
 * Prüft die Hülle der Datei — Kennung und Format-Fassung.
 *
 * Getrennt vom Inhalt, weil hier andere Fragen gestellt werden: Ist das
 * überhaupt unsere Datei, und verstehen wir ihr Format? Erst danach lohnt der
 * Blick auf die Daten.
 *
 * @param data Eingelesenes JSON.
 * @returns Fehlertext, oder `null` wenn die Hülle stimmt.
 */
function checkEnvelope(data: Record<string, unknown>): BackupError | null {
  if (data.kind !== BACKUP_KIND) {
    return { key: 'wrongKind' }
  }
  if (typeof data.schemaVersion !== 'number') {
    return { key: 'noSchemaVersion' }
  }
  if (data.schemaVersion > BACKUP_SCHEMA_VERSION) {
    return {
      key: 'newerFormat',
      params: { found: data.schemaVersion, known: BACKUP_SCHEMA_VERSION },
    }
  }
  return null
}

/**
 * Liest und prüft den Inhalt einer Sicherungsdatei.
 *
 * Streng statt nachsichtig: Eine halb gelesene Datei würde ein halbes Depot
 * herstellen, und das fiele erst auf, wenn die Zahlen nicht mehr stimmen. Im
 * Zweifel lieber ablehnen — die Datei ist ja noch da.
 *
 * @param raw Dateiinhalt als Text.
 */
export function parseBackup(raw: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { ok: false, error: { key: 'invalidJson' } }
  }

  if (!isRecord(data)) {
    return { ok: false, error: { key: 'notAnObject' } }
  }

  const envelopeError = checkEnvelope(data)
  if (envelopeError) return { ok: false, error: envelopeError }

  const portfolio = parsePortfolio(data.portfolio)
  if ('key' in portfolio) return { ok: false, error: portfolio }

  if (!isRecord(data.settings)) {
    return { ok: false, error: { key: 'noSettings' } }
  }

  return {
    ok: true,
    backup: {
      kind: BACKUP_KIND,
      schemaVersion: data.schemaVersion as number,
      appVersion: typeof data.appVersion === 'string' ? data.appVersion : 'unbekannt',
      exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
      portfolio,
      // Fehlende Felder ergänzt der Settings-Store beim Übernehmen
      // (`withDefaults`) — eine ältere Sicherung soll nicht daran scheitern,
      // dass später ein Feld hinzugekommen ist.
      settings: data.settings as unknown as Settings,
      allowlist: parseAllowlist(data.allowlist),
      valueHistory: parseValueHistory(data.valueHistory),
    },
  }
}

/**
 * Liest die Freigabeliste.
 *
 * Bewusst nachsichtig statt streng: Ein unbrauchbarer Eintrag bedeutet
 * höchstens, dass ein Papier in der Auswahl auftaucht, das man ausgeblendet
 * hatte — ärgerlich, aber ohne Folgen für die Zahlen. Die Sicherung deswegen
 * ganz abzulehnen stünde in keinem Verhältnis.
 */
function parseAllowlist(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) return {}

  const entries: Record<string, boolean> = {}
  for (const [key, enabled] of Object.entries(value)) {
    if (typeof enabled === 'boolean') entries[key] = enabled
  }
  return entries
}

/** Prüft das Depot; gibt bei einem Fehler den Grund zurück. */
function parsePortfolio(value: unknown): Portfolio | BackupError {
  if (!isRecord(value)) return { key: 'noPortfolio' }

  if (typeof value.id !== 'string' || value.id === '') return { key: 'noPortfolioId' }
  if (typeof value.name !== 'string') return { key: 'noPortfolioName' }
  if (!Array.isArray(value.positions)) return { key: 'noPositions' }

  const positions: Position[] = []
  const seen = new Set<string>()

  for (const [index, entry] of value.positions.entries()) {
    const position = parsePosition(entry, index)
    if ('key' in position) return position

    // Doppelte Kennungen würden beim Bearbeiten die falsche Zeile treffen.
    if (seen.has(position.id)) {
      return { key: 'duplicateId', params: { at: index + 1, id: position.id } }
    }
    seen.add(position.id)
    positions.push(position)
  }

  const now = new Date().toISOString()
  return {
    id: value.id,
    name: value.name,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
    // Der letzte Ausgleich gehört zum Depot: Ohne ihn stünde ein
    // wiederhergestelltes Depot beim Kalender-Rebalancing sofort auf „fällig".
    lastRebalancedAt: typeof value.lastRebalancedAt === 'string' ? value.lastRebalancedAt : null,
    positions,
  }
}

/**
 * Liest die Tageswerte.
 *
 * Fehlerhafte Einträge werden übergangen statt die ganze Sicherung
 * abzulehnen: Ein unlesbarer Tageswert ist ein Schönheitsfehler in der Kurve,
 * kein Grund, ein Depot nicht wiederherzustellen.
 */
function parseValueHistory(value: unknown): ValueSnapshot[] {
  if (!Array.isArray(value)) return []

  return value
    .filter(
      (entry): entry is ValueSnapshot =>
        isRecord(entry) &&
        typeof entry.date === 'string' &&
        typeof entry.total === 'number' &&
        Number.isFinite(entry.total),
    )
    .map((entry) => ({ date: entry.date, total: entry.total }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Prüft eine Position; gibt bei einem Fehler den Grund zurück. */
function parsePosition(value: unknown, index: number): Position | BackupError {
  const at = index + 1
  if (!isRecord(value)) return { key: 'positionNotAnObject', params: { at } }

  if (typeof value.id !== 'string' || value.id === '') return { key: 'positionNoId', params: { at } }
  if (typeof value.symbol !== 'string' || value.symbol === '') {
    return { key: 'positionNoSymbol', params: { at } }
  }

  if (!GROUPS.includes(value.group as AssetGroup)) {
    return { key: 'positionGroup', params: { at, group: String(value.group) } }
  }

  // Endliche Zahlen, keine Texte: `NaN` oder "100" würden sich erst in den
  // Kennzahlen zeigen, und dort sieht man die Ursache nicht mehr.
  if (!isFiniteNumber(value.units)) return { key: 'positionUnits', params: { at } }
  if (!isFiniteNumber(value.targetPercent)) return { key: 'positionTarget', params: { at } }
  if (value.targetPercent < 0 || value.targetPercent > 100) {
    return { key: 'positionTargetRange', params: { at } }
  }

  return {
    id: value.id,
    isin: typeof value.isin === 'string' ? value.isin : null,
    symbol: value.symbol,
    displayName: typeof value.displayName === 'string' ? value.displayName : value.symbol,
    group: value.group as AssetGroup,
    kind: KINDS.includes(value.kind as InstrumentKind) ? (value.kind as InstrumentKind) : null,
    units: value.units,
    targetPercent: value.targetPercent,
    // Fehlend heißt aktiv — ältere Sicherungen kannten das Feld nicht.
    enabled: typeof value.enabled === 'boolean' ? value.enabled : true,
    ...(typeof value.notes === 'string' ? { notes: value.notes } : {}),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
