import { describe, expect, it } from 'vitest'

/**
 * Smoke-Test — stellt sicher, dass Vitest korrekt aufgesetzt ist.
 * Wird durch echte Tests in tests/domain/... ersetzt, sobald das Domain-Modul da ist.
 */
describe('scaffolding', () => {
  it('vitest läuft', () => {
    expect(1 + 1).toBe(2)
  })
})
