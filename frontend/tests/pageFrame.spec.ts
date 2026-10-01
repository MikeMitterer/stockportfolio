import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const sourceRoot = resolve(process.cwd(), 'frontend/src')
const routerSource = readFileSync(resolve(sourceRoot, 'router/index.ts'), 'utf8')

describe('Inhaltsrahmen der Hauptseiten', () => {
  it('verwendet auf jeder regulären Route den gemeinsamen Abstand zur Kopfzeile', () => {
    const viewNames = [...routerSource.matchAll(/import\('@\/views\/(\w+View)\.vue'\)/g)]
      .map((match) => match[1])
      // Die Methodenseite nutzt bewusst eine schmale Lesespalte mit eigenem Polster.
      .filter((name) => name !== 'MethodView')
    const missingFrames = viewNames.filter((name) => {
      const source = readFileSync(resolve(sourceRoot, 'views', `${name}.vue`), 'utf8')
      return !/@include content-frame(?:\([^;]*\))?;/.test(source)
    })

    expect(viewNames.length).toBeGreaterThan(4)
    expect(missingFrames).toEqual([])
  })
})
