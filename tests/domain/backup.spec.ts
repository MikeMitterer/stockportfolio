/**
 * Tests für Sicherung und Wiederherstellung.
 *
 * Der Schwerpunkt liegt auf dem, was `parseBackup` **ablehnt**. Eine halb
 * eingelesene Datei stellt ein halbes Depot her, und das fällt erst auf, wenn
 * die Kennzahlen nicht mehr stimmen — dann ist die Ursache längst aus dem
 * Blick. Und weil die Datei das einzige Backup ist, muss klar sein, dass ein
 * Roundtrip nichts verliert.
 */

import { describe, expect, it } from 'vitest'
import {
  BACKUP_KIND,
  BACKUP_SCHEMA_VERSION,
  backupFileName,
  buildBackup,
  parseBackup,
} from '@/domain/backup'
import { defaultSettings } from '@/stores/settings'
import type { Portfolio, Position } from '@/types/portfolio'

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    id: 'p-1',
    isin: 'IE00B3RBWM25',
    symbol: 'VGWL.DE',
    displayName: 'Vanguard FTSE All-World',
    group: 'stocks',
    kind: 'etf',
    units: 500,
    targetPercent: 45,
    enabled: true,
    ...overrides,
  }
}

function makePortfolio(positions: Position[] = [makePosition()]): Portfolio {
  return {
    id: 'depot-1',
    name: 'Mein Depot',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    positions,
  }
}

/** Baut eine gültige Sicherung als Text — Ausgangspunkt für die Fehlerfälle. */
function validRaw(mutate: (data: Record<string, unknown>) => void = () => {}): string {
  const backup = buildBackup(
    makePortfolio(),
    defaultSettings('depot-1'),
    '0.1.0',
    '2026-08-10T18:00:00.000Z',
  )
  const data = JSON.parse(JSON.stringify(backup)) as Record<string, unknown>
  mutate(data)
  return JSON.stringify(data)
}

describe('buildBackup', () => {
  it('kennzeichnet die Datei, damit fremdes JSON nicht durchrutscht', () => {
    const backup = buildBackup(makePortfolio(), defaultSettings('d'), '0.1.0', 'jetzt')

    expect(backup.kind).toBe(BACKUP_KIND)
    expect(backup.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
  })

  it('nimmt Depot und Einstellungen unverändert auf', () => {
    const portfolio = makePortfolio()
    const settings = defaultSettings('depot-1')
    const backup = buildBackup(portfolio, settings, '0.1.0', 'jetzt')

    expect(backup.portfolio).toEqual(portfolio)
    expect(backup.settings).toEqual(settings)
  })
})

describe('backupFileName', () => {
  it('enthält Depotnamen und Datum', () => {
    // Mehrere Sicherungen im Download-Ordner sollen unterscheidbar sein,
    // ohne dass man sie öffnet.
    expect(backupFileName('Mein Depot', '2026-08-10T18:00:00.000Z')).toBe(
      'stockportfolio-mein-depot-2026-08-10.json',
    )
  })

  it('entschärft Zeichen, die in Dateinamen stören', () => {
    expect(backupFileName('Depot / 2026 «alt»', '2026-08-10T18:00:00.000Z')).toBe(
      'stockportfolio-depot-2026-alt-2026-08-10.json',
    )
  })

  it('fällt bei einem Namen ohne verwertbare Zeichen auf „depot" zurück', () => {
    expect(backupFileName('«»', '2026-08-10T18:00:00.000Z')).toBe(
      'stockportfolio-depot-2026-08-10.json',
    )
  })
})

describe('parseBackup — der gute Fall', () => {
  it('liest eine selbst geschriebene Sicherung wieder ein', () => {
    const result = parseBackup(validRaw())
    expect(result.ok).toBe(true)
  })

  it('verliert beim Roundtrip keine Position', () => {
    // Das ist der eigentliche Zweck der Datei: Was hineingeht, kommt heraus.
    const portfolio = makePortfolio([
      makePosition({ id: 'a', symbol: 'A.DE', notes: 'Kernanlage' }),
      makePosition({ id: 'b', symbol: 'B.DE', group: 'moneymarket', kind: null, enabled: false }),
      makePosition({ id: 'c', symbol: 'CASH', group: 'cash', isin: null, units: 5000 }),
    ])
    const raw = JSON.stringify(
      buildBackup(portfolio, defaultSettings('depot-1'), '0.1.0', '2026-08-10T18:00:00.000Z'),
    )

    const result = parseBackup(raw)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.backup.portfolio.positions).toEqual(portfolio.positions)
  })

  it('nimmt eine ältere Format-Fassung an', () => {
    const result = parseBackup(validRaw((data) => (data.schemaVersion = BACKUP_SCHEMA_VERSION - 1)))
    expect(result.ok).toBe(true)
  })

  it('behandelt eine fehlende Aktiv-Angabe als aktiv', () => {
    // Ältere Sicherungen kannten das Feld nicht — sie sollen nicht dazu
    // führen, dass plötzlich alle Positionen stillgelegt sind.
    const result = parseBackup(
      validRaw((data) => {
        const portfolio = data.portfolio as { positions: Record<string, unknown>[] }
        delete portfolio.positions[0]!.enabled
      }),
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.backup.portfolio.positions[0]?.enabled).toBe(true)
  })
})

describe('parseBackup — was abgelehnt wird', () => {
  it('kein JSON', () => {
    const result = parseBackup('das ist keine Datei')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('JSON')
  })

  it('fremdes JSON ohne Kennung', () => {
    // Der wahrscheinlichste Fehlgriff: irgendeine andere Datei aus dem
    // Download-Ordner.
    const result = parseBackup('{"foo": 1}')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('Kennung')
  })

  it('eine JSON-Liste statt eines Objekts', () => {
    expect(parseBackup('[]').ok).toBe(false)
  })

  it('eine neuere Format-Fassung, statt zu raten', () => {
    const result = parseBackup(validRaw((data) => (data.schemaVersion = BACKUP_SCHEMA_VERSION + 1)))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('neueren Fassung')
  })

  it('fehlendes Depot', () => {
    const result = parseBackup(validRaw((data) => delete data.portfolio))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('Depot')
  })

  it('fehlende Positionsliste', () => {
    const result = parseBackup(
      validRaw((data) => delete (data.portfolio as Record<string, unknown>).positions),
    )
    expect(result.ok).toBe(false)
  })

  it('fehlende Einstellungen', () => {
    const result = parseBackup(validRaw((data) => delete data.settings))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('Einstellungen')
  })

  it('eine unbekannte Assetklasse', () => {
    const result = parseBackup(
      validRaw((data) => {
        const portfolio = data.portfolio as { positions: Record<string, unknown>[] }
        portfolio.positions[0]!.group = 'krypto'
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('krypto')
  })

  it('einen Bestand als Text', () => {
    // "500" statt 500 rechnet sich später zu Unsinn zusammen, ohne zu werfen.
    const result = parseBackup(
      validRaw((data) => {
        const portfolio = data.portfolio as { positions: Record<string, unknown>[] }
        portfolio.positions[0]!.units = '500'
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('Bestand')
  })

  it('einen Ziel-Anteil außerhalb von 0–100', () => {
    const result = parseBackup(
      validRaw((data) => {
        const portfolio = data.portfolio as { positions: Record<string, unknown>[] }
        portfolio.positions[0]!.targetPercent = 140
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('0–100')
  })

  it('doppelte Kennungen', () => {
    // Sonst trifft jede Bearbeitung womöglich die falsche Zeile.
    const result = parseBackup(
      validRaw((data) => {
        const portfolio = data.portfolio as { positions: Record<string, unknown>[] }
        portfolio.positions.push({ ...portfolio.positions[0]! })
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('mehrfach')
  })

  it('nennt die Nummer der beanstandeten Position', () => {
    // Bei 30 Positionen ist „irgendwas stimmt nicht" wertlos.
    const result = parseBackup(
      validRaw((data) => {
        const portfolio = data.portfolio as { positions: Record<string, unknown>[] }
        portfolio.positions.push({ ...portfolio.positions[0]!, id: 'zwei', units: null })
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('Position 2')
  })
})
