/**
 * Wächter: Netzwerkzugriffe gibt es nur unter `src/api/` (T-88).
 *
 * Die REST- und SSE-Clients lagen über `api/`, `auth/` und `data/` verteilt.
 * Wer wissen wollte, mit welchen Servern die App spricht und über welche
 * Pfade, musste an drei Stellen suchen — und eine vierte Stelle wäre nicht
 * aufgefallen. Seit T-88 liegt jede Gegenstelle in einem Unterordner von
 * `src/api/` (`stockinfo/`, `account/`, `data/`). Dieser Test hält das fest:
 * Er prüft nicht die bekannten Stellen, sondern jede künftige.
 *
 * Gesucht wird über die TypeScript-Compiler-API, nicht per Textsuche: Ein
 * Kommentar, der `fetch(` erklärt, ist kein Aufruf, und ein Pfad in einem
 * Template-String ist einer.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { PROJECT_ROOT } from './helpers/projectRoot'

const SRC = resolve(PROJECT_ROOT, 'frontend/src')
const API_DIR = resolve(SRC, 'api')

/** Konstruktoren, die eine Verbindung öffnen. */
const NETWORK_CONSTRUCTORS = new Set(['EventSource', 'XMLHttpRequest', 'WebSocket'])
/** Funktionen, die eine Anfrage absenden — auch als `window.fetch` oder `navigator.sendBeacon`. */
const NETWORK_CALLS = new Set(['fetch', 'sendBeacon'])

/** Alle Quelldateien unter `src/`, rekursiv. */
function sourceFiles(dir: string = SRC): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(ts|vue)$/.test(entry.name) ? [path] : []
  })
}

/** Der Skriptteil einer Datei; bei `.vue` alle `<script>`-Blöcke. */
function scriptOf(path: string): string {
  const source = readFileSync(path, 'utf8')
  if (!path.endsWith('.vue')) return source
  return [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]).join('\n')
}

/** Name eines Aufrufziels: `fetch`, `window.fetch`, `navigator.sendBeacon`. */
function calleeName(expression: ts.Expression): string | undefined {
  if (ts.isIdentifier(expression)) return expression.text
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text
  return undefined
}

/** Ein Pfad zur eigenen API: `/api` oder `/api/…`. */
function isApiPath(text: string): boolean {
  return text === '/api' || text.startsWith('/api/')
}

/** Alle Netzwerkzugriffe einer Quelle als lesbare Fundstellen. */
export function networkAccesses(fileName: string, script: string): string[] {
  const file = ts.createSourceFile(fileName, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const found: string[] = []
  const report = (node: ts.Node, what: string) => {
    const { line } = file.getLineAndCharacterOfPosition(node.getStart())
    found.push(`${fileName}:${line + 1} ${what}`)
  }
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const name = calleeName(node.expression)
      if (name && NETWORK_CALLS.has(name)) report(node, `${name}(…)`)
    }
    if (ts.isNewExpression(node)) {
      const name = calleeName(node.expression)
      if (name && NETWORK_CONSTRUCTORS.has(name)) report(node, `new ${name}(…)`)
    }
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node)) &&
      isApiPath(node.text)
    ) {
      report(node, `Pfad „${node.text}“`)
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return found
}

describe('Netzwerkzugriffe des Frontends', () => {
  it('liegen alle unter src/api/', () => {
    const found = sourceFiles()
      .filter((path) => !path.startsWith(`${API_DIR}/`))
      .flatMap((path) => networkAccesses(relative(PROJECT_ROOT, path), scriptOf(path)))

    expect(
      found,
      `Netzwerkzugriff außerhalb von src/api/ — in den Client der Gegenstelle verschieben:\n${found.join('\n')}`,
    ).toEqual([])
  })

  it('findet Aufrufe, Verbindungen und Pfade, aber keine Kommentare', () => {
    const found = networkAccesses(
      'probe.ts',
      [
        '// fetch("/api/kommentar") ist kein Aufruf',
        'await fetch(url)',
        'await window.fetch(url)',
        'navigator.sendBeacon(url)',
        'new EventSource(url)',
        'new globalThis.WebSocket(url)',
        'const path = `/api/data/${id}`',
        "const base = '/api'",
        "const other = '/apix'",
      ].join('\n'),
    )
    expect(found).toEqual([
      'probe.ts:2 fetch(…)',
      'probe.ts:3 fetch(…)',
      'probe.ts:4 sendBeacon(…)',
      'probe.ts:5 new EventSource(…)',
      'probe.ts:6 new WebSocket(…)',
      'probe.ts:7 Pfad „/api/data/“',
      'probe.ts:8 Pfad „/api“',
    ])
  })

  it('sieht die Clients unter src/api/ selbst', () => {
    // Gegenprobe: Würde die Suche nichts finden, wäre der erste Test wertlos.
    const inApi = sourceFiles(API_DIR).flatMap((path) =>
      networkAccesses(relative(PROJECT_ROOT, path), scriptOf(path)),
    )
    for (const client of ['api/stockinfo/client.ts', 'api/account/client.ts', 'api/data/client.ts', 'api/data/liveEvents.ts']) {
      expect(inApi.some((entry) => entry.includes(client)), client).toBe(true)
    }
  })
})
