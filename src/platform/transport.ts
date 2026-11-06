// The transport seam.
//
// This is the one file a backend swaps. Today it is a mock: there is no server,
// so `send` hands the action straight to the reducer and `subscribe` has nothing
// to push. A WebSocket or Matrix transport implements the same interface —
// `send` writes a frame, `subscribe` reads inbound frames — and App.tsx changes
// not at all.
//
// Inbound events are deliberately part of the interface even though the mock
// never emits one: the subscription is already wired in App.tsx, so a real
// transport can push agent replies and presence without touching a component.

import type { Message } from '../lib/types'
import type { Action } from '../lib/workspace-state'

/** Something the backend pushes at the client. */
export type InboundEvent = {
  type: 'agentReply'
  channelId: string
  message: Message
}

export interface Transport {
  /**
   * Outbound. Every user action passes through here before it reaches the
   * reducer, so a real transport can ship it to the server as well as applying
   * it optimistically.
   */
  send(action: Action): void

  /** Inbound. Returns an unsubscribe function. */
  subscribe(listener: (event: InboundEvent) => void): () => void

  /** Ids for optimistic inserts. A backend may reassign them; the mock does not. */
  newId(): string

  /** Timestamps, so a transport can be frozen in a test. */
  now(): string
}

/**
 * The local-only transport: the reducer stands in for the server, and no event
 * ever arrives from outside.
 */
export function createMockTransport(apply: (action: Action) => void): Transport {
  const listeners = new Set<(event: InboundEvent) => void>()

  return {
    send(action) {
      apply(action)
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    newId: () => crypto.randomUUID(),
    now: () => new Date().toISOString(),
  }
}
