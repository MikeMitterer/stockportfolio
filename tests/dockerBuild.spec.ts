import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const temporaryDirectories: string[] = []
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

/** Führt das echte Buildscript aus; nur äußere Bibliothek/Prozesse sind Fakes. */
function createBuildFixture() {
  const root = mkdtempSync(join(tmpdir(), 'stockportfolio-docker-'))
  temporaryDirectories.push(root)
  const docker = join(root, 'docker')
  const libraries = join(root, 'libs')
  const bin = join(root, 'bin')
  const projectTools = join(root, 'tools')
  for (const directory of [docker, libraries, bin, join(projectTools, 'bash')]) mkdirSync(directory, { recursive: true })
  copyFileSync(resolve('docker/build.sh'), join(docker, 'build.sh'))
  const trace = join(root, 'trace')
  const imageId = `sha256:${'a'.repeat(64)}`
  writeFileSync(trace, '')
  writeFileSync(join(libraries, 'build.lib.sh'), `
RED='' NC='' YELLOW='' GREEN='' BLUE='' MACHINE=Darwin ARCHITECTURE=arm64
usageLine() { :; }
showSamples() { :; }
`)
  writeFileSync(join(libraries, 'version.lib.sh'), 'gitDockerTag() { echo 0.2.0-test; }\n')
  writeFileSync(join(libraries, 'docker.lib.sh'), `
buildSingleArchImage() { echo "local:$1" >> "$TRACE"; return "\${BUILD_RC:-0}"; }
showImages() { :; }
pushImage2DockerHub() { echo image-push >> "$TRACE"; return "\${PUSH_RC:-0}"; }
pushImage2GHCR() { echo ghcr-push >> "$TRACE"; }
pushImage2Amazon() { echo ecr-push >> "$TRACE"; }
`)
  writeFileSync(join(bin, 'docker'), `#!/usr/bin/env bash
if [[ "$1 $2" == 'image inspect' ]]; then echo '${imageId}';
else echo "docker:$*" >> "$TRACE"; fi
`, { mode: 0o755 })
  writeFileSync(join(projectTools, 'bash/dockerhub-readme.sh'), `#!/usr/bin/env bash
for ARGUMENT in "$@"; do
  if [[ "$ARGUMENT" == --preview ]]; then
    echo preview >> "$TRACE"; exit "\${PREVIEW_RC:-0}"
  elif [[ "$ARGUMENT" == --publish ]]; then
    echo "readme-publish:\${DOCKER_README_AFTER_PUSH:-}" >> "$TRACE"
    exit "\${README_RC:-0}"
  fi
done
`, { mode: 0o755 })
  const marker = join(docker, '.last-build-tag')
  const run = (args: string[], extraEnvironment: Record<string, string> = {}) => spawnSync('bash', [join(docker, 'build.sh'), ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, BASH_LIBS: libraries, PROJECT_TOOLS: projectTools, TRACE: trace, TARGET: 'dockerhub', ...extraEnvironment },
  })
  return { run, marker, imageId, calls: () => readFileSync(trace, 'utf8').trim().split('\n').filter(Boolean) }
}

describe('Docker-Build und README-Übertragung', () => {
  it('zeigt Hilfe ohne Buildmarker und lehnt unklare Optionen ab', () => {
    const fixture = createBuildFixture()
    expect(fixture.run([]).status).toBe(0)
    for (const args of [['--typo'], ['--build-and-push'], ['--build', 'unknown'], ['--build', 'all'], ['--push', 'extra']]) {
      expect(fixture.run(args).status).toBe(2)
    }
    expect(existsSync(fixture.marker)).toBe(false)
    expect(fixture.calls()).toEqual([])
  })

  it.each(['linux/amd64', 'amd64', 'x86', 'x86_64'])('lädt %s nur lokal und speichert die Image-ID', platform => {
    const fixture = createBuildFixture()
    expect(fixture.run(['--build', platform]).status).toBe(0)
    expect(fixture.calls()).toEqual(['local:linux/amd64'])
    expect(readFileSync(fixture.marker, 'utf8')).toContain(`single\n${fixture.imageId}\n`)
  })

  it.each(['linux/arm64', 'arm64', 'aarch64', 'arm', 'm1'])('erkennt ARM-Plattform %s', platform => {
    const fixture = createBuildFixture()
    expect(fixture.run(['--build', platform]).status).toBe(0)
    expect(fixture.calls()).toEqual(['local:linux/arm64'])
  })

  it('verwendet ohne Plattformangabe den ARM-Host', () => {
    const fixture = createBuildFixture()
    expect(fixture.run(['--build']).status).toBe(0)
    expect(fixture.calls()).toEqual(['local:linux/arm64'])
  })

  it('bindet beide Push-Tags an die gespeicherte ID und überträgt erst danach das README', () => {
    const fixture = createBuildFixture()
    expect(fixture.run(['--build']).status).toBe(0)
    expect(fixture.run(['--push']).status).toBe(0)
    expect(fixture.calls()).toEqual([
      'local:linux/arm64',
      `docker:tag ${fixture.imageId} mangolila/stockportfolio:0.2.0-test`,
      `docker:tag ${fixture.imageId} mangolila/stockportfolio:latest`,
      'preview', 'image-push', 'readme-publish:1',
    ])
  })

  it('verhindert Push nach gescheitertem Neubau statt alten Marker weiterzuverwenden', () => {
    const fixture = createBuildFixture()
    expect(fixture.run(['--build']).status).toBe(0)
    expect(fixture.run(['--build'], { BUILD_RC: '1' }).status).not.toBe(0)
    expect(fixture.run(['--push']).status).not.toBe(0)
    expect(fixture.calls()).not.toContain('image-push')
  })

  it('stoppt bei Vorschaufehler vor der Veröffentlichung und bei Pushfehler vor dem README', () => {
    const fixture = createBuildFixture()
    expect(fixture.run(['--build']).status).toBe(0)
    expect(fixture.run(['--push'], { PREVIEW_RC: '1' }).status).not.toBe(0)
    expect(fixture.calls()).not.toContain('image-push')
    expect(fixture.run(['--push'], { PUSH_RC: '1' }).status).not.toBe(0)
    expect(fixture.calls()).not.toContain('readme-publish:1')
  })

  it('meldet einen README-Fehler nach erfolgreichem Image-Push als Fehler', () => {
    const fixture = createBuildFixture()
    expect(fixture.run(['--build']).status).toBe(0)
    expect(fixture.run(['--push'], { README_RC: '1' }).status).not.toBe(0)
    expect(fixture.calls()).toContain('image-push')
    expect(fixture.calls().at(-1)).toBe('readme-publish:1')
  })

  it.each(['ghcr', 'ecr'])('überträgt für %s kein Docker-Hub-README', target => {
    const fixture = createBuildFixture()
    expect(fixture.run(['--build']).status).toBe(0)
    expect(fixture.run(['--push'], { TARGET: target, AMAZON_REPO_URI: 'ecr.example/repo' }).status).toBe(0)
    expect(fixture.calls()).toContain(`${target}-push`)
    expect(fixture.calls()).not.toContain('preview')
    expect(fixture.calls()).not.toContain('readme-publish:1')
  })
})
