import { describe, expect, it, vi } from 'vitest'
import { LiveEventsClient } from '@/data/liveEvents'

class FakeEventStream extends EventTarget {
  closed = false
  readyState = 1

  close(): void {
    this.closed = true
    this.readyState = 2
  }

  emit(kind: string, value?: object | string): void {
    this.dispatchEvent(kind === 'resource'
      ? new MessageEvent(kind, { data: typeof value === 'string' ? value : JSON.stringify(value) })
      : new Event(kind))
  }
}

describe('private SSE-Hinweise', () => {
  it('meldet Verbindungen und nur gültige Ressourcenereignisse', () => {
    const stream = new FakeEventStream()
    const connected = vi.fn()
    const disconnected = vi.fn()
    const resource = vi.fn()
    const client = new LiveEventsClient(() => stream)

    client.start({ connected, disconnected, resource })
    stream.emit('open')
    stream.emit('resource', { kind: 'portfolio', resourceId: 'depot', revision: 2 })
    stream.emit('resource', { kind: 'quote-refresh', resourceId: 'current', revision: 1 })
    stream.emit('resource', { kind: 'unknown', resourceId: 'depot', revision: 3 })
    stream.emit('resource', 'kein JSON')
    stream.emit('error')

    expect(connected).toHaveBeenCalledOnce()
    expect(resource).toHaveBeenCalledTimes(2)
    expect(resource).toHaveBeenCalledWith({ kind: 'portfolio', resourceId: 'depot', revision: 2 })
    expect(resource).toHaveBeenCalledWith({ kind: 'quote-refresh', resourceId: 'current', revision: 1 })
    expect(disconnected).toHaveBeenCalledOnce()
    client.stop()
    expect(stream.closed).toBe(true)
    stream.emit('resource', { kind: 'portfolio', resourceId: 'depot', revision: 4 })
    expect(resource).toHaveBeenCalledTimes(2)
  })

  it('baut einen endgültig geschlossenen Stream nach einer Pause neu auf', () => {
    vi.useFakeTimers()
    try {
      const streams: FakeEventStream[] = []
      const connected = vi.fn()
      const disconnected = vi.fn()
      const client = new LiveEventsClient(() => {
        const stream = new FakeEventStream()
        streams.push(stream)
        return stream
      })

      const stream = (index: number): FakeEventStream => {
        const entry = streams[index]
        if (!entry) throw new Error(`Stream ${index} wurde nicht angelegt`)
        return entry
      }

      client.start({ connected, disconnected, resource: vi.fn() })
      // Der Browser wiederholt nur selbst, solange der Stream nicht CLOSED ist.
      stream(0).emit('error')
      vi.advanceTimersByTime(60_000)
      expect(streams).toHaveLength(1)

      // Eine Fehlerantwort beim Wiederverbinden schließt die EventSource endgültig.
      stream(0).readyState = 2
      stream(0).emit('error')
      vi.advanceTimersByTime(4_999)
      expect(streams).toHaveLength(1)
      vi.advanceTimersByTime(1)
      expect(streams).toHaveLength(2)
      expect(stream(0).closed).toBe(true)

      stream(1).readyState = 2
      stream(1).emit('error')
      vi.advanceTimersByTime(9_999)
      expect(streams).toHaveLength(2)
      vi.advanceTimersByTime(1)
      expect(streams).toHaveLength(3)

      stream(2).emit('open')
      expect(connected).toHaveBeenCalledOnce()
      stream(2).readyState = 2
      stream(2).emit('error')
      vi.advanceTimersByTime(5_000)
      expect(streams).toHaveLength(4)
      expect(disconnected).toHaveBeenCalledTimes(4)

      stream(3).readyState = 2
      stream(3).emit('error')
      client.stop()
      vi.advanceTimersByTime(60_000)
      expect(streams).toHaveLength(4)
    } finally {
      vi.useRealTimers()
    }
  })
})
