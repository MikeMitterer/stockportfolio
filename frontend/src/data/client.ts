export type ResourceKind = 'portfolio' | 'settings' | 'allowlist' | 'snapshots' | 'quote-refresh'
import type { Backup } from '@/domain/backup'

export interface PrivateResource<T> {
  resourceId: string
  revision: number
  value: T
}

export class PrivateDataError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(code)
  }
}

export const DATA_ERROR_EVENT = 'stockportfolio:data-error'
export const DATA_RECOVERED_EVENT = 'stockportfolio:data-recovered'

function path(kind: ResourceKind, id: string): string {
  return `/api/data/${kind}/${encodeURIComponent(id)}`
}

export class PrivateDataClient {
  private readonly revisions = new Map<string, number>()
  private readonly writtenRevisions = new Map<string, number>()
  private readonly pending = new Map<string, Promise<unknown>>()

  constructor(private readonly fetcher: typeof fetch = globalThis.fetch.bind(globalThis)) {}

  private key(kind: ResourceKind, id: string): string {
    return `${kind}:${id}`
  }

  revisionOf(kind: ResourceKind, id: string): number | null {
    return this.revisions.get(this.key(kind, id)) ?? null
  }

  /** Nur eigene bestätigte Schreibvorgänge dürfen ihr SSE-Ereignis überspringen. */
  wroteRevision(kind: ResourceKind, id: string, revision: number): boolean {
    return this.writtenRevisions.get(this.key(kind, id)) === revision
  }

  /** Wartet auf eine eigene Änderung, bevor ein gleichzeitiges SSE-Ereignis verglichen wird. */
  async whenIdle(kind: ResourceKind, id: string): Promise<void> {
    await this.pending.get(this.key(kind, id))?.catch(() => undefined)
  }

  private async request<T>(url: string, method = 'GET', data?: object, reportConflict = true): Promise<T> {
    let response: Response
    try {
      response = await this.fetcher(url, {
        method,
        credentials: 'same-origin',
        ...(method === 'GET' ? {} : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data ?? {}),
        }),
      })
    } catch {
      const error = new PrivateDataError(0, 'unavailable')
      window.dispatchEvent(new CustomEvent(DATA_ERROR_EVENT, { detail: error }))
      throw error
    }
    if (!response.ok) {
      const result = await response.json().catch(() => null) as { error?: string } | null
      const error = new PrivateDataError(response.status, result?.error ?? 'request_failed')
      if ((response.status !== 404 || method !== 'GET') && (reportConflict || response.status !== 409)) {
        window.dispatchEvent(new CustomEvent(DATA_ERROR_EVENT, { detail: error }))
      }
      throw error
    }
    return response.json() as Promise<T>
  }

  private async exclusive<T>(kind: ResourceKind, id: string, action: () => Promise<T>): Promise<T> {
    const key = this.key(kind, id)
    const previous = this.pending.get(key) ?? Promise.resolve()
    const current = previous.catch(() => undefined).then(action)
    this.pending.set(key, current)
    try {
      return await current
    } finally {
      if (this.pending.get(key) === current) this.pending.delete(key)
    }
  }

  async list<T>(kind: ResourceKind): Promise<PrivateResource<T>[]> {
    const result = await this.request<{ resources: PrivateResource<T>[] }>(`/api/data/${kind}`)
    const present = new Set(result.resources.map((resource) => this.key(kind, resource.resourceId)))
    for (const key of this.revisions.keys()) {
      if (key.startsWith(`${kind}:`) && !present.has(key)) this.revisions.delete(key)
    }
    for (const resource of result.resources) this.revisions.set(this.key(kind, resource.resourceId), resource.revision)
    return result.resources
  }

  async get<T>(kind: ResourceKind, id: string): Promise<PrivateResource<T> | null> {
    try {
      const resource = await this.request<PrivateResource<T>>(path(kind, id))
      this.revisions.set(this.key(kind, id), resource.revision)
      return resource
    } catch (error) {
      if (error instanceof PrivateDataError && error.status === 404) {
        this.revisions.delete(this.key(kind, id))
        return null
      }
      throw error
    }
  }

  save<T>(kind: ResourceKind, id: string, value: T): Promise<number> {
    return this.exclusive(kind, id, async () => {
      const revision = this.revisions.get(this.key(kind, id)) ?? 0
      const result = await this.request<{ revision: number }>(path(kind, id), 'PUT', { revision, value })
      this.revisions.set(this.key(kind, id), result.revision)
      this.writtenRevisions.set(this.key(kind, id), result.revision)
      return result.revision
    })
  }

  update<T>(
    kind: ResourceKind,
    id: string,
    change: (value: T | null) => T,
    options: { conflictRetries?: number; reportConflict?: boolean } = {},
  ): Promise<number> {
    return this.exclusive(kind, id, async () => {
      for (let attempt = 0; ; attempt += 1) {
        const current = await this.get<T>(kind, id)
        try {
          const result = await this.request<{ revision: number }>(path(kind, id), 'PUT', {
            revision: current?.revision ?? 0,
            value: change(current?.value ?? null),
          }, options.reportConflict ?? true)
          this.revisions.set(this.key(kind, id), result.revision)
          this.writtenRevisions.set(this.key(kind, id), result.revision)
          return result.revision
        } catch (error) {
          if (!(error instanceof PrivateDataError) || error.status !== 409 || attempt >= (options.conflictRetries ?? 0)) throw error
        }
      }
    })
  }

  remove(kind: ResourceKind, id: string): Promise<void> {
    return this.exclusive(kind, id, async () => {
      const revision = this.revisions.get(this.key(kind, id)) ?? (await this.get(kind, id))?.revision
      if (revision === undefined) return
      await this.request(path(kind, id), 'DELETE', { revision })
      this.revisions.delete(this.key(kind, id))
      this.writtenRevisions.set(this.key(kind, id), revision + 1)
    })
  }

  async importLegacy(portfolios: object[], settings: object | null): Promise<void> {
    await this.request('/api/data/legacy-import', 'POST', { portfolios, settings })
    this.revisions.clear()
    this.writtenRevisions.clear()
  }

  async restoreBackup(backup: Backup, replacedId: string | null): Promise<void> {
    const id = backup.portfolio.id
    const [portfolio, settings, allowlist, snapshots, replaced] = await Promise.all([
      this.get('portfolio', id),
      this.get('settings', 'current'),
      this.get('allowlist', id),
      this.get('snapshots', id),
      replacedId && replacedId !== id ? this.get('portfolio', replacedId) : Promise.resolve(null),
    ])
    const snapshotValues = backup.valueHistory.map((entry) => ({
      ...entry,
      portfolioId: id,
      key: `${id}::${entry.currency}::${entry.date}`,
    }))
    await this.request('/api/data/restore', 'POST', {
      portfolio: backup.portfolio,
      settings: { ...backup.settings, activePortfolioId: id },
      allowlist: backup.allowlist,
      snapshots: snapshotValues,
      replacedId,
      revisions: {
        portfolio: portfolio?.revision ?? 0,
        settings: settings?.revision ?? 0,
        allowlist: allowlist?.revision ?? 0,
        snapshots: snapshots?.revision ?? 0,
        replaced: replaced?.revision ?? null,
      },
    })
    this.revisions.clear()
    this.writtenRevisions.clear()
  }
}

// Vite führt dieses Modul während der Entwicklung erneut aus, ohne die
// angemeldete App neu zu starten. Die aktive Verbindung liegt deshalb
// zusätzlich in `import.meta.hot.data`, das jede neue Modulfassung erbt.
// Sie wird bei jeder Änderung geschrieben, nicht erst beim Dispose: Module,
// die Vite nur als Abhängigkeit neu lädt, erhalten keinen Dispose-Aufruf.
let activeClient: PrivateDataClient | null = import.meta.hot?.data?.activeClient ?? null

function setActiveClient(client: PrivateDataClient | null): void {
  activeClient = client
  if (import.meta.hot?.data) import.meta.hot.data.activeClient = client
}

export function activatePrivateData(client: PrivateDataClient): void {
  setActiveClient(client)
}

export function deactivatePrivateData(): void {
  setActiveClient(null)
}

export function privateDataClient(): PrivateDataClient | null {
  return activeClient
}
