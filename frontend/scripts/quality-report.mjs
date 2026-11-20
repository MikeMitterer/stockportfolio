// Berichtet Komplexität, Verschachtelung und Dateigröße für ein TypeScript-
// Paket (make quality, T-99). Nur Bericht: Befunde enden mit Exit-Code 0.
// Läuft ESLint selbst nicht, endet das Skript mit 1 — ein leerer Bericht soll
// nie bloß bedeuten, dass die Prüfung gar nicht lief.
//
// Aufruf aus dem Projekt-Root:
//   node frontend/scripts/quality-report.mjs <Paketordner> <Ordner ...>
//   node frontend/scripts/quality-report.mjs frontend src
import { relative, resolve } from 'node:path'
import { ESLint } from 'eslint'

/** Schwellen als Anhaltspunkte, nicht als Sperre. */
const rules = {
  complexity: ['warn', 15],
  'max-depth': ['warn', 4],
  'max-lines': ['warn', 500],
}

const [packageDir, ...patterns] = process.argv.slice(2)
if (!packageDir || patterns.length === 0) {
  console.error('Aufruf: node frontend/scripts/quality-report.mjs <Paketordner> <Ordner ...>')
  process.exit(2)
}

const cwd = resolve(packageDir)
try {
  const eslint = new ESLint({ cwd, overrideConfig: { rules } })
  const results = await eslint.lintFiles(patterns)
  let findings = 0
  let unreadable = 0
  for (const result of results) {
    const file = relative(process.cwd(), result.filePath)
    for (const message of result.messages) {
      // Ein Parsefehler hat keine Regel: Die Datei ist ungeprüft und darf nicht
      // als „0 Befunde“ durchgehen.
      if (message.fatal || message.ruleId === null) {
        unreadable++
        console.log(`${file}:${message.line ?? 0}:${message.column ?? 0} nicht auswertbar: ${message.message}`)
        continue
      }
      if (!(message.ruleId in rules)) continue
      findings++
      console.log(`${file}:${message.line}:${message.column} ${message.ruleId} ${message.message}`)
    }
  }
  console.log(`${packageDir}: ${findings} Befunde${unreadable ? `, ${unreadable} nicht auswertbar` : ''}`)
} catch (error) {
  console.error(`ESLint lief nicht: ${error.message}`)
  process.exit(1)
}
