import type { ResourceKind } from '../persistence/repository.js'

export interface ResourceEvent {
  kind: ResourceKind
  resourceId: string
  revision: number
}

class Subscription {
  private readonly pending = new Map<string, ResourceEvent>()
  private wake: (() => void) | null = null
  private closed = false

  constructor(private readonly unsubscribe: () => void) {}

  push(event: ResourceEvent): void {
    if (this.closed) return
    this.pending.set(`${event.kind}:${event.resourceId}`, event)
    this.wake?.()
  }

  async next(timeoutMs: number): Promise<ResourceEvent | null> {
    if (this.closed) return null
    if (this.pending.size === 0) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          this.wake = null
          resolve()
        }, timeoutMs)
        this.wake = () => {
          clearTimeout(timer)
          this.wake = null
          resolve()
        }
      })
    }
    const first = this.pending.entries().next().value
    if (!first) return null
    this.pending.delete(first[0])
    return first[1]
  }

  close(): void {
    if (this.closed) return
    this.closed = true
    this.pending.clear()
    this.unsubscribe()
    this.wake?.()
  }
}

export class ResourceEvents {
  private readonly subscribers = new Map<string, Set<Subscription>>()

  subscribe(userId: string): Subscription {
    const group = this.subscribers.get(userId) ?? new Set<Subscription>()
    const subscription = new Subscription(() => {
      group.delete(subscription)
      if (group.size === 0) this.subscribers.delete(userId)
    })
    group.add(subscription)
    this.subscribers.set(userId, group)
    return subscription
  }

  publish(userId: string, event: ResourceEvent): void {
    for (const subscription of this.subscribers.get(userId) ?? []) subscription.push(event)
  }
}
