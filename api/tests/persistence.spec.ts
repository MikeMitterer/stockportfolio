import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createSqliteRepository } from '../src/persistence/repository'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

function createTestRepository() {
  const directory = mkdtempSync(join(tmpdir(), 'stockportfolio-server-'))
  temporaryDirectories.push(directory)
  return createSqliteRepository(join(directory, 'test.sqlite'))
}

describe('Server-Persistenz', () => {
  it('legt den ersten Admin nur einmal an und behält ihn nach einem Neustart', () => {
    const repository = createTestRepository()
    const first = repository.createFirstAdmin('mike', 'hash-one', 1000)
    expect(first?.role).toBe('admin')
    expect(first?.isSetupAccount).toBe(true)
    expect(first?.legacyImported).toBe(false)
    expect(repository.createFirstAdmin('other', 'hash-two', 1001)).toBeNull()

    const second = repository.createUser('other', 'hash-two', 'admin', 1001)
    expect(second.isSetupAccount).toBe(false)
    expect(second.legacyImported).toBe(false)

    const filePath = repository.filePath
    repository.close()
    const reopened = createSqliteRepository(filePath)
    expect(reopened.findUserByName('mike')?.id).toBe(first?.id)
    expect(reopened.findUserByName('mike')?.isSetupAccount).toBe(true)
    expect(reopened.findUserByName('other')?.isSetupAccount).toBe(false)
    reopened.close()
  })

  it('überträgt die Altbestandsberechtigung bei Deaktivierung nicht auf einen anderen Admin', () => {
    const repository = createTestRepository()
    const setup = repository.createFirstAdmin('mike', 'hash-one', 1000)!
    repository.createUser('other', 'hash-two', 'admin', 1001)
    expect(repository.deactivateUser(setup.id)).toBe('done')
    expect(repository.findUserById(setup.id)?.active).toBe(false)
    expect(repository.reactivateUser(setup.id)).toBe(true)
    expect(repository.findUserById(setup.id)?.isSetupAccount).toBe(true)
    repository.close()
  })
})
