#!/usr/bin/env node
// Prüft vor `npm ci`, ob Node und npm die Bereiche aus `engines` der
// package.json eines Teilprojekts erfüllen (make setup, T-106). Nötig, weil npm
// eine Abweichung nur als Warnung meldet: Unter npm 10 griffen die Freigaben in
// `allowScripts` gar nicht, und ESLint 10 läuft nur auf Node ^22.13 oder >=24.
//
// Aufruf: node scripts/check-engines.mjs <Teilprojekt>   (etwa frontend, api)
// `engines` kennt hier nur Bereiche aus `>=X.Y.Z` und `^X.Y.Z`, verbunden mit `||`.
// Vorabversionen (etwa 11.18.0-rc.0) erfüllen keinen Bereich, wie bei semver.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const directory = process.argv[2]
if (!directory) {
  console.error('Aufruf: node scripts/check-engines.mjs <Teilprojekt>')
  process.exit(2)
}

const engines = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')).engines ?? {}

/** Zerlegt „X.Y.Z“ samt optionalem v und Vorabkennung; `null` bei anderer Form. */
function parse(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?$/.exec(version.trim())
  if (!match) return null
  return { numbers: match.slice(1, 4).map(Number), prerelease: match[4] !== undefined }
}

/** Vergleicht zwei Zahlentripel: negativ, 0 oder positiv. */
function compare(left, right) {
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) return left[index] - right[index]
  }
  return 0
}

/**
 * Erfüllt `version` den Bereich? Wirft bei einer Bereichsform, die dieses
 * Skript nicht kennt; ein stilles Bestehen wäre sonst ein falsches Grün.
 */
function satisfies(version, range) {
  const actual = parse(version)
  if (!actual) throw new Error(`Version „${version}“ nicht lesbar`)
  if (actual.prerelease) return false
  return range.split('||').some((alternative) => {
    const match = /^(>=|\^)\s*(\d+\.\d+\.\d+)$/.exec(alternative.trim())
    if (!match) throw new Error(`Bereich „${alternative.trim()}“ – erwartet „>=X.Y.Z“ oder „^X.Y.Z“`)
    const minimum = parse(match[2]).numbers
    if (compare(actual.numbers, minimum) < 0) return false
    return match[1] === '>=' || actual.numbers[0] === minimum[0]
  })
}

const actual = {
  node: process.versions.node,
  npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(),
}

let failed = false
for (const tool of ['node', 'npm']) {
  const range = engines[tool]
  if (range === undefined) continue
  try {
    if (!satisfies(actual[tool], range)) {
      console.error(`  ✗ ${tool} ${actual[tool]} passt nicht zu ${directory}: verlangt ${range}`)
      failed = true
    }
  } catch (error) {
    console.error(`  ✗ ${directory}/package.json: engines.${tool}: ${error.message}`)
    failed = true
  }
}
if (failed) {
  console.error('    Node: https://nodejs.org · npm: npm install -g npm@11')
  process.exit(1)
}
