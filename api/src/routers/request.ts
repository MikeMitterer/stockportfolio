/** Gemeinsame Typen und Leser für Anfragen der Konto-API. */
import type { HttpBindings } from '@hono/node-server'
import type { Context, Hono } from 'hono'
import { ServiceError } from '../auth/service.js'

export type ServerContext = Context<{ Bindings: HttpBindings }>
export type ApiApp = Hono<{ Bindings: HttpBindings }>

export function readObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ServiceError(400, 'invalid_request')
  }
  return value as Record<string, unknown>
}

export function readString(value: unknown): string {
  if (typeof value !== 'string') throw new ServiceError(400, 'invalid_request')
  return value
}

export function readRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0)
    throw new ServiceError(400, 'invalid_revision')
  return value as number
}

export async function body(context: ServerContext): Promise<Record<string, unknown>> {
  try {
    return readObject(await context.req.json())
  } catch (error) {
    if (error instanceof ServiceError) throw error
    throw new ServiceError(400, 'invalid_json')
  }
}
