#!/usr/bin/env node
// Prüft vor `npm ci`, ob Node und npm die Mindestversionen aus `engines` der
// package.json eines Teilprojekts erfüllen (make setup, T-106). Nötig, weil npm
// eine Unterschreitung nur als Warnung meldet: Unter npm 10 griffen die
// Freigaben in `allowScripts` gar nicht, und ESLint 10 braucht Node 22.13.
//
// Aufruf: node scripts/check-engines.mjs <Teilprojekt>   (etwa frontend, api)
// `engines` kennt hier nur die Form ">=X.Y.Z".
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const directory = process.argv[2]
if (!directory) {
  console.error('Aufruf: node scripts/check-engines.mjs <Teilprojekt>')
  process.exit(2)
}

const engines = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')).engines ?? {}

/** Zerlegt eine Version „X.Y.Z“ (mit oder ohne führendes v) in Zahlen. */
function parts(version) {
  return version.replace(/^v/, '').split('.').map((part) => Number.parseInt(part, 10))
}

/** Ist `actual` mindestens `minimum`? */
function atLeast(actual, minimum) {
  const [have, need] = [parts(actual), parts(minimum)]
  for (let index = 0; index < 3; index++) {
    if ((have[index] ?? 0) !== (need[index] ?? 0)) return (have[index] ?? 0) > (need[index] ?? 0)
  }
  return true
}

const actual = {
  node: process.versions.node,
  npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(),
}

let failed = false
for (const tool of ['node', 'npm']) {
  const range = engines[tool]
  if (range === undefined) continue
  const match = /^>=\s*(\d+\.\d+\.\d+)$/.exec(range.trim())
  if (!match) {
    console.error(`  ✗ ${directory}/package.json: engines.${tool} „${range}“ – erwartet wird „>=X.Y.Z“`)
    failed = true
  } else if (!atLeast(actual[tool], match[1])) {
    console.error(`  ✗ ${tool} ${actual[tool]} ist zu alt für ${directory}: verlangt ${range}`)
    failed = true
  }
}
if (failed) {
  console.error('    Node: https://nodejs.org · npm: npm install -g npm@11')
  process.exit(1)
}
