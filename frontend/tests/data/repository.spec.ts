import { afterEach, describe, expect, it, vi } from 'vitest'
import { deactivatePrivateData } from '@/data/client'
import { createPortfolioRepository } from '@/data/repository'

afterEach(() => {
  deactivatePrivateData()
  vi.unstubAllEnvs()
})

describe('private Repository-Wahl', () => {
  it('schreibt ohne aktiven Datenclient im Produktbetrieb nicht in den Altbestand', () => {
    vi.stubEnv('MODE', 'production')
    deactivatePrivateData()
    expect(() => createPortfolioRepository()).toThrow('PrivateDataClient fehlt')
  })
})
