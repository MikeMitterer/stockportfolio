import type { ResourceKind } from './client'

export interface ResourceEvent {
  kind: ResourceKind
  resourceId: string
  revision: number
}

export interface LiveEventHandlers {
  connected: () => void
  disconnected: () => void
  resource: (event: ResourceEvent) => void
}

interface EventStream {
  readonly readyState: number
  addEventListener(type: string, listener: EventListener): void
  close(): void
}

/** `EventSource.CLOSED`: Der Browser versucht keine eigene Wiederverbindung mehr. */
const CLOSED = 2
const firstRetryMs = 5_000
const maxRetryMs = 30_000

function parseResource(data: string): ResourceEvent | null {
  try {
    const value: unknown = JSON.parse(data)
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
    const record = value as Record<string, unknown>
    if (
      record.kind !== 'portfolio' && record.kind !== 'settings' &&
      record.kind !== 'allowlist' && record.kind !== 'snapshots' && record.kind !== 'quote-refresh'
    ) return null
    if (typeof record.resourceId !== 'string' || !record.resourceId) return null
    if (!Number.isSafeInteger(record.revision) || (record.revision as number) < 1) return null
    return { kind: record.kind, resourceId: record.resourceId, revision: record.revision as number }
  } catch {
    return null
  }
}

export class LiveEventsClient {
  private source: EventStream | null = null
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private retryMs = firstRetryMs

  constructor(private readonly createSource: (url: string) => EventStream = (url) => new EventSource(url)) {}

  start(handlers: LiveEventHandlers): void {
    this.stop()
    this.retryMs = firstRetryMs
    this.connect(handlers)
  }

  stop(): void {
    if (this.retryTimer !== null) clearTimeout(this.retryTimer)
    this.retryTimer = null
    this.source?.close()
    this.source = null
  }

  private connect(handlers: LiveEventHandlers): void {
    const source = this.createSource('/api/data/events')
    this.source = source
    source.addEventListener('open', () => {
      if (this.source !== source) return
      this.retryMs = firstRetryMs
      handlers.connected()
    })
    source.addEventListener('error', () => {
      if (this.source !== source) return
      handlers.disconnected()
      // Netzfehler wiederholt der Browser selbst. Eine Fehlerantwort, etwa ein
      // 502 des Proxys während eines Neustarts, schließt den Stream endgültig.
      if (source.readyState === CLOSED) this.scheduleReconnect(handlers)
    })
    source.addEventListener('resource', (event) => {
      if (this.source !== source) return
      const resource = parseResource((event as MessageEvent<string>).data)
      if (resource) handlers.resource(resource)
    })
  }

  private scheduleReconnect(handlers: LiveEventHandlers): void {
    this.source?.close()
    const delay = this.retryMs
    this.retryMs = Math.min(this.retryMs * 2, maxRetryMs)
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      this.connect(handlers)
    }, delay)
  }
}
