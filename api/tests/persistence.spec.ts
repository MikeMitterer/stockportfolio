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
    expect(repository.createFirstAdmin('other', 'hash-two', 1001)).toBeNull()

    const filePath = repository.filePath
    repository.close()
    const reopened = createSqliteRepository(filePath)
    expect(reopened.findUserByName('mike')?.id).toBe(first?.id)
    reopened.close()
  })
})
