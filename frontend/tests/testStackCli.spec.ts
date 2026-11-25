import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { PROJECT_ROOT } from './helpers/projectRoot'

/**
 * Startet die echte Testserver-CLI mit der Python-venv aus make setup. Mit `-S` lädt Python
 * keine installierten Pakete; so läuft dieselbe CLI ohne cli_theme.
 */
function runCli(args: string[], withTheme: boolean) {
  const python = resolve(PROJECT_ROOT, '.venv/bin/python')
  const script = resolve(PROJECT_ROOT, 'scripts/test-stack.py')
  return spawnSync(python, [...(withTheme ? [] : ['-S']), script, ...args], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  })
}

describe('Testserver-CLI mit und ohne CLITheme', () => {
  it('gestaltet Hilfe und Fehler mit cli_theme', () => {
    const help = runCli(['--help'], true)
    expect(help.status).toBe(0)
    expect(help.stdout).toContain('-r | --run')

    const failure = runCli(['--stop', '--nope'], true)
    expect(failure.status).toBe(2)
    expect(failure.stderr).toContain('✗ unrecognized arguments: --nope')
  })

  it('läuft ohne cli_theme mit der schlichten argparse-Ausgabe weiter', () => {
    const help = runCli(['--help'], false)
    expect(help.status).toBe(0)
    expect(help.stdout).toContain('-r, --run')
    expect(help.stdout).not.toContain('-r | --run')

    const failure = runCli(['--stop', '--nope'], false)
    expect(failure.status).toBe(2)
    expect(failure.stderr).toContain('error: unrecognized arguments: --nope')
  })
})
