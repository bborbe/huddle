// Web implementation of the platform seam's persistence + id/timestamp services.
// A native shell would provide its own module with the same signatures.
// Everything here is browser-only; src/lib stays free of it.

// Bump when the seed shape or identities change, so a browser holding stale
// state reseeds instead of showing members that no longer exist.
//   v1 → v2  seed identities changed
//   v2 → v3  Workspace gained `spaces` and Category gained `spaceId`; a v2 blob
//            has no `spaces`, so the space filter crashed on `.map` of undefined
const KEY = 'huddle:v3'

/**
 * A persisted blob is only usable if it still has the shape the current build
 * reads. A key bump discards yesterday's blob; this check stops the *next* shape
 * change from blanking the page for anyone who kept today's.
 */
function isUsableState(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const state = value as { workspace?: unknown; activeChannelId?: unknown }
  if (typeof state.activeChannelId !== 'string') return false

  const workspace = state.workspace
  if (typeof workspace !== 'object' || workspace === null) return false
  const ws = workspace as Record<string, unknown>

  return (
    Array.isArray(ws.spaces) &&
    Array.isArray(ws.members) &&
    Array.isArray(ws.categories) &&
    Array.isArray(ws.channels)
  )
}

export function loadState<T>(fallback: T): T {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    // Fail closed: a malformed or stale blob reseeds rather than being returned
    // as T and crashing the first render that reads a missing field.
    if (!isUsableState(parsed)) return fallback
    return parsed as T
  } catch {
    return fallback
  }
}

export function saveState(state: unknown): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage full or disabled — the demo keeps working in memory.
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export function newId(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}
